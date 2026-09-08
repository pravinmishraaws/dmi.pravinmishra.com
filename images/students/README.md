# Student photos

Drop student photos here, then map them in `data/student-photos.json`
(keyed by GitHub username, lowercase).

- Square images crop best — they render as a 40px circle on the leaderboards.
- ~200x200 is plenty; anything larger is wasted bytes on a 158-row table.
- Name the file after the GitHub username (`kachiraju.jpg`) so the mapping
  stays obvious.

A student with no entry shows their initials, and so does a broken path —
neither is an error.

## Where the photos come from

Students upload one through the roster Google Form. Google Forms drops the
file in Pravin's Drive and writes a **private** `drive.google.com/open?id=…`
link into the response sheet — no browser loading the leaderboard can fetch
it, and neither can `curl` (it redirects to a Google sign-in page). Nothing
connects that upload to this folder, so the step is manual, and review-agent
names the backlog on every run ("Uploaded a photo, still showing initials").

To clear the backlog:

1. Get the pending list from a `review-agent` run, or diff the form sheet's
   photo column against this folder.
2. Open each `drive.google.com/file/d/<ID>/view` in a browser **signed in as
   the Drive owner** and use the viewer's download button. Scripted fetches
   don't work: the file is private, and Drive's CSP blocks a page-context
   `fetch()` of its own download URL.
3. Crop square, resize to 240x240, save as JPEG q85, named for the lowercase
   GitHub username. Apply EXIF orientation first (phone uploads) and flatten
   any transparency onto white.
4. Add the line to `../../data/student-photos.json`.

**Crop toward the face, not the centre.** These render through
`object-fit: cover` in a 40px circle, so a plain centre crop decapitates a
full-length phone shot — several arrive at 485x1080 or 1918x2560. Check each
one against a circular preview before committing.
