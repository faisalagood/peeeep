<img src="https://i.imgur.com/ZLzqKmy.png" alt="PEEEEP">

**PEEEEP** is a browser extension that enhances your Twitch viewing experience by integrating third-party emotes directly into Twitch chat.

## Features

- 🖼 **Support for Third-Party Emotes**: Displays emotes from 7TV, FrankerFaceZ (FFZ), and BetterTTV (BTTV) in Twitch chat.
- 🔍 **Emote Tooltips on Hover**: See emote information when you click an emote, including emote name, source, and a larger version.
- 🎨 **7TV Modifier Emote Support**: Limited support for emote modifiers (currently only from 7TV).
- ⚠️ **Note**: Firefox support is temporarily removed due to compatibility issues <img src="https://cdn.frankerfacez.com/emote/425196/1" alt="Sadge">

## Installation

### Chrome Web Store (Recommended)
1. Visit [PEEEEP on the Chrome Web Store](https://chromewebstore.google.com/detail/PEEEEP/jcpmcidfnegbeommcjdjelbfpcindkfb)
2. Click "Add to Chrome"
3. The extension will automatically install and be ready to use!

## Building from Source

### Prerequisites

- Ensure you have **Node.js** and **npm** installed for building the extension from source.

### Steps

1. **Clone this repository**:

   ```bash
   git clone https://github.com/faisalagood/peeeep.git
   cd peeeep
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the extension**:

   ```bash
   npm run build
   ```

4. **Load the extension in Chrome**:

   - Go to `chrome://extensions/`.
   - Enable **Developer mode** in the top right corner.
   - Click **Load unpacked** and select the project’s root directory.

   The extension will now be installed in your browser!

## Usage

1. After installing, navigate to any Twitch channel to automatically load supported emotes in chat.
2. Click on any emote to see its tooltip, displaying details like emote name, source, and a preview image.

## Development

To contribute or make modifications:

1. **Clone the repository** if you haven’t already.
2. **Make your changes** in the source files.
3. **Rebuild the extension**:

   ```bash
   npm run build
   ```

4. **Reload the extension** in your browser as outlined in the installation steps.

## Troubleshooting

- **Firefox**: Support for Firefox is temporarily paused; stay tuned for future updates!
- **Other Issues**: Feel free to [open an issue](https://github.com/faisalagood/peeeep/issues) if you encounter any bugs or need help.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
