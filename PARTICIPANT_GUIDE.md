# Participant Tutorial

## How to Submit Your Buildathon Project

This guide explains how to submit your project through GitHub.

You will not push directly to the main repository. Instead, you will:

1. Fork the official repository.
2. Add your project inside your own folder.
3. Push changes to your fork.
4. Open a Pull Request.

Official repository:

```text
https://github.com/habiboffdev/office-face-greeting-buildathon
```

## 1. Fork the Repository

Open the official repository in your browser:

```text
https://github.com/habiboffdev/office-face-greeting-buildathon
```

Click the **Fork** button in the top-right corner.

GitHub will create your own copy of the repository under your GitHub account.

## 2. Clone Your Fork

Open your forked repository.

Click **Code**, then copy the HTTPS URL.

It will look like this:

```text
https://github.com/YOUR_USERNAME/office-face-greeting-buildathon.git
```

Open your terminal and run:

```bash
git clone https://github.com/YOUR_USERNAME/office-face-greeting-buildathon.git
cd office-face-greeting-buildathon
```

Replace `YOUR_USERNAME` with your GitHub username.

## 3. Create Your Submission Folder

Create a folder inside `submissions/`.

Use your real name or GitHub username.

Example:

```bash
mkdir -p submissions/ali-valiyev
```

Your project must be inside your own folder only.

Good:

```text
submissions/ali-valiyev/
```

Not good:

```text
README.md
app.py
main.py
```

Do not put your project files in the root of the repository.

## 4. Add Your Project Files

Put your full project inside your folder.

Recommended structure:

```text
submissions/your-name/
├── README.md
├── src/
├── requirements.txt or package.json
├── demo-link.txt
└── technical-notes.md
```

Your folder must include:

- working source code
- `README.md` with setup and run instructions
- `demo-link.txt` with your demo video link
- `technical-notes.md` with short technical notes

## 5. Write Your README.md

Inside your own folder, create:

```text
submissions/your-name/README.md
```

It should explain:

- what your project does
- what technology you used
- how to install dependencies
- how to run the project
- any known limitations

Example:

```markdown
# Ali Valiyev Submission

## Tech Stack

Python + OpenCV + DeepFace + PyQt

## Setup

pip install -r requirements.txt

## Run

python app.py

## Notes

The app stores face data locally and shows greeting overlays for known people.
```

## 6. Add Demo Link

Create:

```text
submissions/your-name/demo-link.txt
```

Paste your demo video link inside it.

The demo video should be 1-3 minutes and show:

- the app starting
- videos playing
- adding a new person
- known person greeting overlay
- unknown person not interrupting video playback

## 7. Add Technical Notes

Create:

```text
submissions/your-name/technical-notes.md
```

Briefly explain:

- architecture
- face detection/recognition method
- database/storage approach
- overlay logic
- what you would improve with more time

## 8. Commit Your Work

Check your files:

```bash
git status
```

Add your files:

```bash
git add submissions/your-name
```

Commit:

```bash
git commit -m "Submit solution - Your Name"
```

Example:

```bash
git commit -m "Submit solution - Ali Valiyev"
```

## 9. Push to Your Fork

Push your changes:

```bash
git push origin main
```

If your branch is named `master`, run:

```bash
git push origin master
```

## 10. Open a Pull Request

Go to your fork on GitHub.

GitHub may show a button:

```text
Compare & pull request
```

Click it.

Make sure the pull request settings are:

```text
base repository: habiboffdev/office-face-greeting-buildathon
base branch: main
head repository: YOUR_USERNAME/office-face-greeting-buildathon
compare branch: main
```

Set the Pull Request title:

```text
Submission: Your Name
```

Example:

```text
Submission: Ali Valiyev
```

Fill in the Pull Request template and click:

```text
Create pull request
```

## Common Problems

### I do not see "Compare & pull request"

Open this page:

```text
https://github.com/habiboffdev/office-face-greeting-buildathon/compare
```

Then choose your fork and branch manually.

### Git says "nothing to commit"

Make sure your files are inside:

```text
submissions/your-name/
```

Then run:

```bash
git status
```

### I accidentally edited another participant's folder

Remove those changes before submitting. Your Pull Request should only include your own folder.

### I pushed directly to my fork. Is that okay?

Yes. You push to your own fork, then open a Pull Request to the official repository.

### Should I submit a separate repository?

No. Submit inside this repository through:

```text
submissions/your-name/
```

## Final Checklist

Before opening your Pull Request, check:

- [ ] My project is inside `submissions/my-name/`
- [ ] I included working source code
- [ ] I included setup instructions in `README.md`
- [ ] I included a demo video link in `demo-link.txt`
- [ ] I included technical notes in `technical-notes.md`
- [ ] My Pull Request title is `Submission: My Name`

