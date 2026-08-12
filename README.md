# Tian Markdown Preview Style

A local VS Code extension that applies `markdown.css` globally to VS Code's built-in Markdown preview.

## Install from the Marketplace

After publication, install it with:

```sh
code --install-extension TianZuo.tian-markdown-preview-style
```

Reload VS Code after installing or updating the extension.

The stylesheet is contributed through `markdown.previewStyles`, so it works with the native Markdown preview and does not require `markdown.styles` in user settings.

## Publish

Requires a Visual Studio Marketplace publisher account and Personal Access Token:

```sh
npx @vscode/vsce login <publisher-id>
npx @vscode/vsce publish
```

The Marketplace publisher ID is `TianZuo`. The extension ID is `TianZuo.tian-markdown-preview-style`.
