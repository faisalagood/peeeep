## <img src="https://cdn.betterttv.net/emote/6290de703c6f14b68848d91b/1x" alt="PEEEEP"> Simple Emote Extension <img src="https://cdn.betterttv.net/emote/6290de703c6f14b68848d91b/1x" alt="PEEEEP">

Simple Emote Extension is a browser extension that enhances your Twitch viewing experience by adding support for third-party emotes.

## Features

- Displays third-party emotes in Twitch chat. (7TV, FFZ, BTTV)
- Shows tooltips with emote information on hover (including emote name, source, and preview).
- Only supports modifier emotes from 7TV. (For now)
- Firefox doesn't work, support removed temporarily. <img src="https://cdn.frankerfacez.com/emote/425196/1" alt="Sadge">

## Installation

1. **Clone this repository**

   ```bash
   git clone https://github.com/faisalagood/simple-emote-extension.git
   ```
   
2. **Load the extension in your browser:**

### Chrome:

- Navigate to `chrome://extensions/`.
- Enable **Developer mode** in the top right corner.
- Click **Load unpacked** and select the **ROOT** directory from the extension's source code.

## Usage

Once the extension is installed, simply navigate to any Twitch channel. The extension will automatically load and display supported emotes in the chat. Hover over an emote to see its tooltip with details such as emote name, source, and a larger preview.

## Development

To contribute or make modifications:

1. Clone the repository and make your changes.
2. Ensure you run the following command:

 ```bash
 npm run build
 ```
3. Reload the extension in your browser as outlined in the **Installation** section.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for details.
