# hexo-font-minify [![Build Status](https://travis-ci.org/akfish/hexo-font-minify.svg?branch=master)](https://travis-ci.org/akfish/hexo-font-minify)

Generate minified fonts containing only used characters.

## Motivation

Chinese fonts are usually huge in size (e.g. Source Hans's size is ~16MB per font variant). It is impractical to include them in web pages. However if we only pick used characters and repack the fonts, the size could be reduced significantly into a reasonable number (a few hundred kB).

## Before You Begin

* This plugin is designed for Hexo theme developers. If you are not developing a theme and decide to use it in your site anyway, make sure that you have some basic understanding of Hexo themes and consulting with your theme's developer for some more specific help.
* Fonts are protected by copyright laws. Make sure you have acquired/purchased proper license for your usage, or use open source fonts. The author of this plugin will not be liable for any legal consequences of your actions.  

## Usage

### Install

#### Option 1: Ask theme users to do it

Ask your theme's users to run the following command in his site project folder:
```bash
$ npm install --save hexo-font-minify
```

#### Option 2: Install in your theme

Run in your theme project folder:
```bash
$ npm install --save hexo-font-minify
```

Create a theme script in your theme's `scripts` folder:
```js
require('hexo-font-minify/lib/main')(hexo);
```

Note that if you do not pack `node_modules` with your theme, you will need to ask users to run:
```bash
$ npm install
```
In cloned theme folder.

### Configuration

(Optional)In your theme's `_config.yml` file, add the following section:
```yaml
# Configuration for hexo-font-minify
# All paths are resolved relative to theme's base dir
# The following are default configuration
font:
  # Source path/pattern of font files
  src: "./fonts/*.ttf"
  # Configuration script
  script: "config.js"
  # URL base for generated font assets
  urlBase: "fonts/" # -> http://yoursite.com/fonts/font.css
  # Cache base
  # Minified font files will be cached in cacheBase/#{hash}
  cacheBase: "./.font-cache"
  # Generate .eot font file
  eot: true
  # Generate .woff font file
  woff: true
  # Generate .svg font file
  svg: true
  # Merge all .css files into one
  mergeCss: true
  # Merged .css file name
  mergeCssName: 'all.css'
  # CSS config, see also https://github.com/akfish/fontmin#css
  css:
    #`location of font file `
    fontPath: './'
    # inject base64 data:application/x-font-ttf; (gzip font with css).
    base64: false
    # generate class for each glyph. default = false
    glyph: false
    # class prefix, only work when glyph is `true`. default to "icon"
    iconPrefix: 'icon'
    # custom fontFamily, default to filename or get from analysed ttf file
    fontFamily: 'myfont'
    # rewrite fontFamily as filename force. default = false
    asFileName: false
    # boolean to add local font. default = false
    local: false
```

Alternatively you can create a `.js` file named `opts.script` in `opts.src` folder (in default settings, it's `fonts/config.js`):
```js
// Exports a function that returns an object
module.exports = function() {
  return {
    // opts
    css: {
      // css.fontFamily supports transform function
      // it can only be provided from script
      fontFamily: function(font, ttf) {
        return ttf.name.fontFamily + "(transformed)";
      }
    }
  }
}
// Or just an object
module.exports = {
  // opts
}
```

Script configuration overrides values in `_config.yml`.


Then copy your fonts to `src` folder (in this case, `./fonts`). Only .ttf format are supported.

### Include generated fonts in your theme

For each font file, a css file with the same will be generated and can be accessed with URL `#{urlBase}/#{font_file_name}.css`.

Add the following code in your theme's `<head>` section:

```ejs
<!DOCTYPE html>
<head>
  <!-- other stuff -->
  <!-- include one font -->
  <%- css("fonts/font_name") %>
  <!-- include all fonts -->
  <%- css("fonts/all") %>
</head>
<body>
  <!-- other stuff -->
</body>
```
