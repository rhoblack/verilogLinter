import * as vscode from 'vscode';
import LintManager from './linter/LintManager';
import FormatManager from './formatter/FormatManager';

let lintManager: LintManager;
let formatManager: FormatManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "verilog-linter" is now active!');

    lintManager = new LintManager();
    context.subscriptions.push(lintManager);

    formatManager = new FormatManager();
    context.subscriptions.push(formatManager);

    let disposable = vscode.commands.registerCommand('verilog-linter.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from Verilog-HDL Linter!');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
    if (lintManager) {
        lintManager.dispose();
    }
    if (formatManager) {
        formatManager.dispose();
    }
}
