# Portfolio: Lemuel Derwin Guballa

A static website (HTML, CSS, a little JavaScript). No build step, no dependencies. It runs as-is on GitHub Pages.

## Project structure

```
index.html          Page content. Every section is labeled with a comment.
css/styles.css      All styling. Colors, fonts and the showreel shape are at the top.
js/main.js          Sticky nav, rail buttons, video preview/sound/larger player.
assets/videos/      Put your ad videos here.
assets/images/      Put poster images and thumbnails here.
```

## Preview on your computer

Open `index.html` in a browser. Or, from this folder, run `python -m http.server 8000` and visit http://localhost:8000.

## Publish on GitHub Pages

1. Create a new public repository on GitHub.
   Name it `lemguballa.github.io` to get the address `https://lemguballa.github.io`.
   Any other name also works, and the site will live at `https://lemguballa.github.io/<repo-name>/`.
2. Upload the contents of this folder to the repository root, so `index.html` sits at the top level.
   (Use "Add file > Upload files", or `git add . && git commit -m "Add portfolio" && git push`.)
3. In the repository, open Settings > Pages.
   Under "Build and deployment", set Source to "Deploy from a branch", choose the `main` branch and the `/ (root)` folder, then Save.
4. Wait one to two minutes, then open your site address. GitHub shows it at the top of the Pages settings.

## Add your videos

The page has a **showreel** slot at the top and three scrolling rows of empty slots below it. Find the comment that says `HOW TO FILL A SLOT` in `index.html`.

- **Self-hosted file:** copy an MP4 (H.264) into `assets/videos/`, then put this inside the slot, replacing the `<span class="slot__empty">` line:
  `<video src="assets/videos/my-ad.mp4" poster="assets/images/my-ad.jpg" muted loop playsinline preload="metadata"></video>`
- **YouTube, Vimeo or Google Drive:** put an `<iframe>` embed inside the slot instead. This is the easiest way for large files.
- **Limits:** GitHub rejects single files over 100 MB, and a Pages site should stay under 1 GB. Compress ads to about 10 to 25 MB each, or use embeds.
- To add a slot, copy a whole `<article class="slot ...">` block. To remove one, delete it.

Once a slot has a video, the site adds these automatically (no extra code needed):

| Feature | Self-hosted `<video>` | `<iframe>` embed |
| --- | --- | --- |
| Click to open a larger player | Yes | Yes |
| Plays a silent preview on hover (desktop) | Yes | No |
| Sound button on hover | Yes | No |

On phones and tablets there is no hover, so tapping a video opens the larger player with full controls.

**Showreel shape:** the showreel frame is wide (21:9) and crops 16:9 videos slightly at the top and bottom. To avoid cropping, change `--cinema-ratio: 21 / 9;` to `16 / 9` at the top of `css/styles.css`. The larger player always shows the full, uncropped video.

## Things to review before you share the link

- Copy in `index.html` (headline, workflow steps, the "Tools I use" list) was written for you. Edit anything that does not match how you work.
- The phone number and street address from your resume are left out on purpose, since this is a public page.
- Add an `og:image` meta tag later if you want a thumbnail when the link is shared.
