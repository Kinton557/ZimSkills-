# ZimSkills
By Kinton Technologies. Static web app (no build step) on Firebase Auth + Firestore.

## Set up
1. Firebase console: create a project, add a Web app, paste its config into `js/firebase-config.js`.
2. Authentication > Sign-in method > enable **Google**. Add `YOUR-USERNAME.github.io` under Authorized domains.
3. Firestore Database > create (production mode) > Rules > paste `firestore.rules` > Publish.
4. Push to GitHub, then Settings > Pages > Deploy from branch `main` / root.

Local test: `npx serve .` (Google sign-in needs `localhost` in Authorized domains).

## Included
Google sign-in, profiles, people directory, jobs (post, search, apply, delete), applicant list for job owners.
Not yet built: courses, certificates, messaging.

## Install as an app
Open the site in Chrome. Tap **Install app** in the top bar (or menu > Install app / Add to Home screen). It then opens full screen with its own icon.
When you change files, bump `V` in `sw.js` (e.g. zimskills-v2).
