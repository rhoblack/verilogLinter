import * as vscode from 'vscode';

export default class VerilogHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return undefined;
    }

    const word = document.getText(range);
    
    // Improved Regex to find declarations
    // This looks for the keyword, then optional bit-width, then a list of symbols containing our word
    const keywordPattern = `(?:reg|wire|logic|input|output|inout|parameter|localparam|integer|genvar|bit|byte|shortint|int|longint)`;
    const declarationPattern = new RegExp(
      `\\b${keywordPattern}\\s+(?:\\[[^\\]]+\\]\\s+)*[^;]*?\\b${word}\\b[^;]*?;`,
      'g'
    );

    const text = document.getText();
    let match;
    let hoverText = '';

    while ((match = declarationPattern.exec(text)) !== null) {
      hoverText = match[0].replace(/\s+/g, ' ').trim();
      break; 
    }

    // fallback for module ports in header
    if (!hoverText) {
        const portPattern = new RegExp(
            `\\b(?:input|output|inout)\\s+(?:\\[[^\\]]+\\]\\s+)*[^,()]*?\\b${word}\\b`,
            'g'
        );
        while ((match = portPattern.exec(text)) !== null) {
            hoverText = match[0].trim();
            break;
        }
    }

    if (hoverText) {
      const markdown = new vscode.MarkdownString();
      markdown.appendCodeblock(hoverText, 'systemverilog');
      return new vscode.Hover(markdown);
    }

    return undefined;
  }
}
