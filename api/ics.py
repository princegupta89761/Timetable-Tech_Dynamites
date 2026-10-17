"""Build iCalendar exports from timetable snapshots."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import re
from typing import Any


_PERIOD_LABEL = re.compile(r"^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$")


def _escape_text(value: Any) -> str:
    text = str(value or "")
    return (
        text.replace("\\", "\\\\")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\n", "\\n")
        .replace(",", "\\,")
        .replace(";", "\\;")
    )


def _start_date(value: str | date | None) -> date:
    if isinstance(value, str):
        return date.fromisoformat(value)
    if value is not None:
        return value
    today = date.today()
    return today + timedelta(days=(7 - today.weekday()) % 7)


def _slot_groups(slots: list[dict[str, Any]], problem: dict[str, Any]) -> list[list[dict[str, Any]]]:
    requirements = {item["id"]: item for item in problem.get("requirements", [])}
    ordered_slots = sorted(
        slots,
        key=lambda slot: (
            slot.get("batch_id", ""),
            slot.get("day", 0),
            slot.get("period", 0),
        ),
    )
    used: set[int] = set()
    groups: list[list[dict[str, Any]]] = []

    for index, slot in enumerate(ordered_slots):
        if index in used:
            continue
        used.add(index)
        group = [slot]
        requirement = requirements.get(slot.get("requirement_id"), {})
        if requirement.get("block_size") == 2:
            for next_index in range(index + 1, len(ordered_slots)):
                candidate = ordered_slots[next_index]
                if (
                    next_index not in used
                    and candidate.get("batch_id") == slot.get("batch_id")
                    and candidate.get("day") == slot.get("day")
                    and candidate.get("period") == slot.get("period", 0) + 1
                    and candidate.get("requirement_id") == slot.get("requirement_id")
                    and candidate.get("room_id") == slot.get("room_id")
                    and candidate.get("teacher_id") == slot.get("teacher_id")
                ):
                    used.add(next_index)
                    group.append(candidate)
                    break
        groups.append(group)

    return groups


def build_ics(
    timetable: dict[str, Any],
    problem: dict[str, Any],
    owner_label: str,
    weeks: int = 16,
    start_date: str | date | None = None,
) -> str:
    """Create a floating-time iCalendar file for a timetable snapshot."""
    base_date = _start_date(start_date)
    periods = {
        period["index"]: period.get("label", "")
        for period in problem.get("config", {}).get("periods", [])
    }
    subjects = {item["id"]: item.get("name", item["id"]) for item in problem.get("subjects", [])}
    batches = {item["id"]: item.get("name", item["id"]) for item in problem.get("batches", [])}
    teachers = {item["id"]: item.get("name", item["id"]) for item in problem.get("teachers", [])}
    rooms = {item["id"]: item.get("name", item["id"]) for item in problem.get("rooms", [])}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Timetable Tech Dynamites//Calendar Export//EN",
        "CALSCALE:GREGORIAN",
        f"X-WR-CALNAME:{_escape_text(owner_label)}",
    ]

    for group in _slot_groups(timetable.get("slots", []), problem):
        first = group[0]
        last = group[-1]
        first_label = periods.get(first.get("period"), "")
        last_label = periods.get(last.get("period"), "")
        first_match = _PERIOD_LABEL.fullmatch(first_label)
        last_match = _PERIOD_LABEL.fullmatch(last_label)
        if not first_match or not last_match:
            raise ValueError(f"Invalid period label for period {first.get('period')!r}.")

        event_date = base_date + timedelta(days=int(first.get("day", 0)))
        start_stamp = f"{event_date:%Y%m%d}T{first_match.group(1).replace(':', '')}00"
        end_stamp = f"{event_date:%Y%m%d}T{last_match.group(2).replace(':', '')}00"
        batch_id = first.get("batch_id", "")
        subject_id = first.get("subject_id", "")
        teacher_id = first.get("teacher_id", "")
        room_id = first.get("room_id", "")
        batch_name = batches.get(batch_id, batch_id)
        subject_name = subjects.get(subject_id, subject_id)

        lines.extend(
            [
                "BEGIN:VEVENT",
                f"UID:{batch_id}-{first.get('day')}-{first.get('period')}@timetable",
                f"DTSTAMP:{stamp}",
                f"DTSTART:{start_stamp}",
                f"DTEND:{end_stamp}",
                f"RRULE:FREQ=WEEKLY;COUNT={weeks}",
                f"SUMMARY:{_escape_text(f'{subject_name} ({batch_name})')}",
                f"LOCATION:{_escape_text(rooms.get(room_id, room_id))}",
                f"DESCRIPTION:{_escape_text(teachers.get(teacher_id, teacher_id))}",
                "END:VEVENT",
            ]
        )

    lines.append("END:VCALENDAR")
    return "\r\n".join(lines)