import * as vscode from 'vscode';
import LintManager from './linter/LintManager';
import FormatManager from './formatter/FormatManager';
import VerilogHoverProvider from './hover/HoverProvider';
import { ModuleIndexer } from './indexer/ModuleIndexer';
import { VerilogCompletionProvider } from './completion/VerilogCompletionProvider';
import { HighlightManager } from './highlight/HighlightManager';

let lintManager: LintManager;
let formatManager: FormatManager;
let moduleIndexer: ModuleIndexer;
let highlightManager: HighlightManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "verilog-linter" is now active!');

    lintManager = new LintManager();
    context.subscriptions.push(lintManager);

    formatManager = new FormatManager(context);
    context.subscriptions.push(formatManager);

    // Register Hover Provider
    const hoverProvider = new VerilogHoverProvider();
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('verilog', hoverProvider),
        vscode.languages.registerHoverProvider('systemverilog', hoverProvider)
    );

    // Initialize and Scan Workspace
    moduleIndexer = new ModuleIndexer();
    moduleIndexer.scanWorkspace();
    context.subscriptions.push(moduleIndexer);

    // Register Completion Provider
    const completionProvider = new VerilogCompletionProvider(moduleIndexer);
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('verilog', completionProvider, '$', '`'),
        vscode.languages.registerCompletionItemProvider('systemverilog', completionProvider, '$', '`')
    );

    // Initialize Highlight Manager (dynamic 4/16 color modes)
    highlightManager = new HighlightManager();
    context.subscriptions.push(highlightManager);

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
    if (moduleIndexer) {
        moduleIndexer.dispose();
    }
    if (highlightManager) {
        highlightManager.dispose();
    }
}
