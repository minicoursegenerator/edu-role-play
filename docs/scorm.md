# SCORM

`edu-role-play` can package a role-play as a SCORM 1.2 ZIP for LMS upload.

```bash
edu-role-play scorm example-support-deescalation.html
```

This writes `example-support-deescalation.scorm.zip` by default. Upload the ZIP to an LMS as a SCORM 1.2 activity. The package contains one SCO that launches `index.html`.

## Reported fields

When the role-play runs inside an LMS, the runtime looks for the SCORM 1.2 `window.API` object in parent and opener windows. If it is present, the runtime reports:

- `cmi.core.lesson_status = incomplete` on launch
- `cmi.core.lesson_status = completed` after final scoring
- `cmi.core.score.raw` as the final weighted score converted to 0-100
- `cmi.core.score.min = 0`
- `cmi.core.score.max = 100`
- `cmi.core.session_time` from the role-play timer
- `cmi.objectives.n.id`, `score.raw`, `score.min`, `score.max`, and `status`
- `cmi.suspend_data` with a compact event summary

SCORM status is completion-only. The runtime does not report pass/fail.

## Results download

The top toolbar includes a results download button. It is disabled until scoring completes, then downloads `<composition-id>-results.json`.

The JSON includes the transcript, final score, per-objective scores, completed objectives, session metadata, and event/activity log. Raw transcript text is not written into SCORM `suspend_data` because SCORM 1.2 storage is small and LMS-visible.

## Limitations

- SCORM 1.2 is the first supported version.
- If no LMS API is found, the role-play still runs normally and no SCORM errors are shown to learners.
- Browser security and LMS launch behavior vary; validate packages in your target LMS before publishing broadly.
