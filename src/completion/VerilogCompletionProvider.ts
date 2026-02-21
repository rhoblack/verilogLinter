import * as vscode from 'vscode';
import { ModuleIndexer, ModuleInfo } from '../indexer/ModuleIndexer';

export class VerilogCompletionProvider implements vscode.CompletionItemProvider {
    constructor(private indexer: ModuleIndexer) {}

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const items: vscode.CompletionItem[] = [];

        // 1. Internal Variables and Signals
        items.push(...this.getInternalSymbols(document));

        // 2. Module Instantiation (Triggered by module name)
        items.push(...this.getModuleCompletions());

        // 3. System Tasks (Triggered by $)
        if (linePrefix.endsWith('$')) {
            items.push(...this.getSystemTaskCompletions());
        }

        // 4. Macros (Triggered by `)
        if (linePrefix.endsWith('`')) {
            items.push(...this.getMacroCompletions(document));
        }

        return items;
    }

    private getInternalSymbols(document: vscode.TextDocument): vscode.CompletionItem[] {
        const text = document.getText();
        const symbolRegex = /\b(reg|wire|logic|integer|genvar|parameter|localparam)\s+(?:\[.*?\]\s+)?(\w+)/g;
        const items: vscode.CompletionItem[] = [];
        const seen = new Set<string>();

        let match;
        while ((match = symbolRegex.exec(text)) !== null) {
            const type = match[1];
            const name = match[2];
            if (!seen.has(name)) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Variable);
                item.detail = type;
                items.push(item);
                seen.add(name);
            }
        }
        return items;
    }

    private getModuleCompletions(): vscode.CompletionItem[] {
        const modules = this.indexer.getModules();
        return modules.map(mod => {
            const item = new vscode.CompletionItem(mod.name, vscode.CompletionItemKind.Module);
            item.detail = 'Module Instantiation';
            
            // Build snippet for instantiation
            let snippet = `${mod.name} #(\n`;
            snippet += mod.params.map((p, i) => `    .${p}(\${${i + 1}:${p}})`).join(',\n');
            snippet += `\n) u_\${${mod.params.length + 1}:${mod.name}} (\n`;
            snippet += mod.ports.map((p, i) => `    .${p}(\${${mod.params.length + i + 2}:${p}})`).join(',\n');
            snippet += `\n);`;

            item.insertText = new vscode.SnippetString(snippet);
            item.documentation = new vscode.MarkdownString(`Instantiate module **${mod.name}** with ports and parameters.`);
            return item;
        });
    }

    private getSystemTaskCompletions(): vscode.CompletionItem[] {
        const tasks = [
            { label: 'display', detail: 'Display formatted text', desc: 'System task for printing to terminal.' },
            { label: 'finish', detail: 'End simulation', desc: 'System task to stop the simulator.' },
            { label: 'time', detail: 'Current simulation time', desc: 'Returns the current simulation time.' },
            { label: 'monitor', detail: 'Monitor variable changes', desc: 'Prints text whenever variables in the list change.' },
            { label: 'readmemh', detail: 'Read hex memory file', desc: 'Loads a memory array from a hexadecimal file.' },
            { label: 'readmemb', detail: 'Read binary memory file', desc: 'Loads a memory array from a binary file.' },
            { label: 'write', detail: 'Write without newline', desc: 'Like $display but does not add a newline.' },
            { label: 'stop', detail: 'Suspend simulation', desc: 'Pauses the simulation execution.' }
        ];

        return tasks.map(t => {
            const item = new vscode.CompletionItem(t.label, vscode.CompletionItemKind.Function);
            item.detail = t.detail;
            item.documentation = t.desc;
            return item;
        });
    }

    private getMacroCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
        const text = document.getText();
        const macroRegex = /`define\s+(\w+)/g;
        const items: vscode.CompletionItem[] = [];
        const seen = new Set<string>();

        let match;
        while ((match = macroRegex.exec(text)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                items.push(new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant));
                seen.add(name);
            }
        }
        return items;
    }
}
