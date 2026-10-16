"""
vcs/diff.py
Plain-English timetable diffing per Contract Section 7.
Matches slots by requirement_id and occurrence order to correctly handle subjects
with multiple lectures per week.
"""

from __future__ import annotations

from typing import Any

DAY_NAMES = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}


def _format_period(period_idx: int, period_map: dict[int, str]) -> str:
    if period_idx in period_map:
        return period_map[period_idx]
    return f"P{period_idx}"


def _format_day(day_idx: int) -> str:
    return DAY_NAMES.get(day_idx, f"Day {day_idx}")


def compute_diff(
    snap_from: dict[str, Any] | str,
    snap_to: dict[str, Any] | str,
    problem: dict[str, Any],
    from_id: str | None = None,
    to_id: str | None = None,
    vcs: Any = None,
) -> dict[str, Any]:
    """
    Computes differences between two timetable snapshots or commit IDs.
    Returns:
    {
      "from": from_id,
      "to": to_id,
      "changes": [ { "type": "moved"|"added"|"removed"|"changed", "text": "...", ... } ],
      "summary": { "moved": int, "added": int, "removed": int, "changed": int }
    }
    """
    # Resolve commit IDs if string was passed
    actual_from_id = from_id or (snap_from if isinstance(snap_from, str) else None)
    actual_to_id = to_id or (snap_to if isinstance(snap_to, str) else None)

    if isinstance(snap_from, str):
        if vcs is None:
            from vcs.commits import get_commit
            c = get_commit(snap_from)
        else:
            c = vcs.get_commit(snap_from)
        if not c:
            raise ValueError(f"Commit '{snap_from}' not found.")
        snap_from = c["snapshot"]

    if isinstance(snap_to, str):
        if vcs is None:
            from vcs.commits import get_commit
            c = get_commit(snap_to)
        else:
            c = vcs.get_commit(snap_to)
        if not c:
            raise ValueError(f"Commit '{snap_to}' not found.")
        snap_to = c["snapshot"]

    slots_from = list(snap_from.get("slots", []))
    slots_to = list(snap_to.get("slots", []))

    # Entity display mappings
    teachers = {t["id"]: t.get("name", t["id"]) for t in problem.get("teachers", [])}
    rooms = {r["id"]: r.get("name", r["id"]) for r in problem.get("rooms", [])}
    batches = {b["id"]: b.get("name", b["id"]) for b in problem.get("batches", [])}
    subjects = {s["id"]: s.get("name", s["id"]) for s in problem.get("subjects", [])}

    config = problem.get("config", {})
    period_map: dict[int, str] = {}
    for p in config.get("periods", []):
        raw_label = str(p.get("label", f"P{p['index']}"))
        if "-" in raw_label:
            period_map[p["index"]] = raw_label.split("-")[0].strip()
        else:
            period_map[p["index"]] = raw_label

    # Group slots by requirement_id (or (batch_id, subject_id) if requirement_id missing)
    def slot_group_key(s: dict[str, Any]) -> str:
        return s.get("requirement_id") or f"{s.get('batch_id')}_{s.get('subject_id')}"

    groups_from: dict[str, list[dict[str, Any]]] = {}
    for s in slots_from:
        groups_from.setdefault(slot_group_key(s), []).append(s)

    groups_to: dict[str, list[dict[str, Any]]] = {}
    for s in slots_to:
        groups_to.setdefault(slot_group_key(s), []).append(s)

    # Sort each group deterministically by (day, period)
    for g in groups_from.values():
        g.sort(key=lambda s: (s.get("day", 0), s.get("period", 0)))
    for g in groups_to.values():
        g.sort(key=lambda s: (s.get("day", 0), s.get("period", 0)))

    all_keys = sorted(set(groups_from.keys()) | set(groups_to.keys()))

    changes: list[dict[str, Any]] = []

    for key in all_keys:
        g_from = groups_from.get(key, [])
        g_to = groups_to.get(key, [])

        matched_from: set[int] = set()
        matched_to: set[int] = set()

        # Step 1: Find identical slots (exact match on day, period, room, teacher)
        for i, sf in enumerate(g_from):
            for j, st in enumerate(g_to):
                if j in matched_to:
                    continue
                if (sf.get("day"), sf.get("period"), sf.get("room_id"), sf.get("teacher_id")) == (
                    st.get("day"),
                    st.get("period"),
                    st.get("room_id"),
                    st.get("teacher_id"),
                ):
                    matched_from.add(i)
                    matched_to.add(j)
                    break

        # Step 2: Match slots at the same time but changed room or teacher
        for i, sf in enumerate(g_from):
            if i in matched_from:
                continue
            for j, st in enumerate(g_to):
                if j in matched_to:
                    continue
                if (sf.get("day"), sf.get("period")) == (st.get("day"), st.get("period")):
                    matched_from.add(i)
                    matched_to.add(j)

                    b_name = batches.get(sf.get("batch_id"), sf.get("batch_id"))
                    s_name = subjects.get(sf.get("subject_id"), sf.get("subject_id"))
                    from_t_name = teachers.get(sf.get("teacher_id"), sf.get("teacher_id"))
                    to_t_name = teachers.get(st.get("teacher_id"), st.get("teacher_id"))
                    from_r_name = rooms.get(sf.get("room_id"), sf.get("room_id"))
                    to_r_name = rooms.get(st.get("room_id"), st.get("room_id"))
                    day_str = _format_day(sf.get("day", 0))
                    p_str = _format_period(sf.get("period", 0), period_map)

                    details = []
                    if sf.get("room_id") != st.get("room_id"):
                        details.append(f"{from_r_name} -> {to_r_name}")
                    if sf.get("teacher_id") != st.get("teacher_id"):
                        details.append(f"{from_t_name} -> {to_t_name}")

                    changes.append({
                        "type": "changed",
                        "batch_id": sf.get("batch_id"),
                        "requirement_id": sf.get("requirement_id"),
                        "slot": st,
                        "from": {"room_id": sf.get("room_id"), "teacher_id": sf.get("teacher_id")},
                        "to": {"room_id": st.get("room_id"), "teacher_id": st.get("teacher_id")},
                        "text": f"{b_name} {s_name}: {day_str} {p_str} changed {', '.join(details)}",
                    })
                    break

        # Step 3: Match remaining slots as "moved" in occurrence order
        unmatched_from = [g_from[i] for i in range(len(g_from)) if i not in matched_from]
        unmatched_to = [g_to[j] for j in range(len(g_to)) if j not in matched_to]

        pairs = min(len(unmatched_from), len(unmatched_to))
        for k in range(pairs):
            sf = unmatched_from[k]
            st = unmatched_to[k]

            b_name = batches.get(sf.get("batch_id"), sf.get("batch_id"))
            s_name = subjects.get(sf.get("subject_id"), sf.get("subject_id"))
            t_name = teachers.get(sf.get("teacher_id"), sf.get("teacher_id"))
            from_day_str = _format_day(sf.get("day", 0))
            from_p_str = _format_period(sf.get("period", 0), period_map)
            from_r_name = rooms.get(sf.get("room_id"), sf.get("room_id"))

            to_day_str = _format_day(st.get("day", 0))
            to_p_str = _format_period(st.get("period", 0), period_map)
            to_r_name = rooms.get(st.get("room_id"), st.get("room_id"))

            changes.append({
                "type": "moved",
                "batch_id": sf.get("batch_id"),
                "requirement_id": sf.get("requirement_id"),
                "from": {"day": sf.get("day"), "period": sf.get("period"), "room_id": sf.get("room_id")},
                "to": {"day": st.get("day"), "period": st.get("period"), "room_id": st.get("room_id")},
                "text": f"{b_name} {s_name} ({t_name}): {from_day_str} {from_p_str} {from_r_name} -> {to_day_str} {to_p_str} {to_r_name}",
            })

        # Step 4: Any surplus in unmatched_to is "added"
        for st in unmatched_to[pairs:]:
            b_name = batches.get(st.get("batch_id"), st.get("batch_id"))
            s_name = subjects.get(st.get("subject_id"), st.get("subject_id"))
            t_name = teachers.get(st.get("teacher_id"), st.get("teacher_id"))
            day_str = _format_day(st.get("day", 0))
            p_str = _format_period(st.get("period", 0), period_map)
            r_name = rooms.get(st.get("room_id"), st.get("room_id"))

            changes.append({
                "type": "added",
                "slot": st,
                "text": f"Added: {b_name} {s_name} ({t_name}) {day_str} {p_str} {r_name}",
            })

        # Step 5: Any surplus in unmatched_from is "removed"
        for sf in unmatched_from[pairs:]:
            b_name = batches.get(sf.get("batch_id"), sf.get("batch_id"))
            s_name = subjects.get(sf.get("subject_id"), sf.get("subject_id"))
            t_name = teachers.get(sf.get("teacher_id"), sf.get("teacher_id"))
            day_str = _format_day(sf.get("day", 0))
            p_str = _format_period(sf.get("period", 0), period_map)
            r_name = rooms.get(sf.get("room_id"), sf.get("room_id"))

            changes.append({
                "type": "removed",
                "slot": sf,
                "text": f"Removed: {b_name} {s_name} ({t_name}) {day_str} {p_str} {r_name}",
            })

    summary = {
        "moved": sum(1 for c in changes if c["type"] == "moved"),
        "added": sum(1 for c in changes if c["type"] == "added"),
        "removed": sum(1 for c in changes if c["type"] == "removed"),
        "changed": sum(1 for c in changes if c["type"] == "changed"),
    }

    return {
        "from": actual_from_id,
        "to": actual_to_id,
        "changes": changes,
        "summary": summary,
    }
