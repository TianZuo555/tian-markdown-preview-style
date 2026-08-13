# Tian Markdown Preview Style

A VS Code extension that applies `markdown.css` globally to VS Code's built-in Markdown preview, adds `==highlighted text==` syntax, and provides Vim-style preview navigation.

Use double equals to highlight text:

```markdown
This is ==highlighted== text.
```

The preview renders it as a styled `<mark>` element.

## Install from the Marketplace

After publication, install it with:

```sh
code --install-extension TianZuo.tian-markdown-preview-style
```

Reload VS Code after installing or updating the extension. Open a new Markdown preview after updating so the parser plugin and navigation script are loaded.

The stylesheet is contributed through `markdown.previewStyles`, so it works with the native Markdown preview and does not require `markdown.styles` in user settings. The navigation script is contributed through `markdown.previewScripts`.

## Vim-style preview navigation

When the Markdown preview has focus, these motions are supported:

| Keys | Action |
| --- | --- |
| `j` / `k` | Scroll down/up one line |
| `h` / `l` | Scroll left/right |
| `Ctrl-e` / `Ctrl-y` | Scroll down/up one line |
| `Ctrl-d` / `Ctrl-u` | Scroll down/up half a page |
| `Ctrl-f` / `Ctrl-b` | Scroll down/up one page |
| `gg` / `G` | Go to top/bottom |
| `zh` / `zl` | Scroll left/right one step |
| `zH` / `zL` | Scroll left/right one page |
| `zt` / `zz` / `zb` | Position at top/center/bottom |
| `H` / `M` / `L` | Position at top/center/bottom |

The script does not intercept keys while a link, button, form control, or editable element is focused. Prefix sequences time out after 500 ms. `jk` remains a VSCode Neovim insert-mode mapping rather than a preview motion: the preview has no Neovim insert/normal modes. In the Markdown source editor, `jk` continues to work through VSCode Neovim.

## Publish

Requires a Visual Studio Marketplace publisher account and Personal Access Token:

```sh
npx @vscode/vsce login <publisher-id>
npx @vscode/vsce publish
```

The repository also includes `.github/workflows/publish.yml`. Add a `VSCE_PAT` repository secret, then push a version tag to run tests and publish automatically:

```sh
git tag v1.2.0
git push origin v1.2.0
```

The Marketplace publisher ID is `TianZuo`. The extension ID is `TianZuo.tian-markdown-preview-style`.
