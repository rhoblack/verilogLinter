import * as vscode from 'vscode';
import { ModuleIndexer } from '../indexer/ModuleIndexer';

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

        // 1. Package Scoping (pkg::member)
        const packageMatch = linePrefix.match(/(\w+)::$/);
        if (packageMatch) {
            return this.getPackageMemberCompletions(packageMatch[1]);
        }

        // 2. System Tasks (Triggered by $)
        if (linePrefix.endsWith('$')) {
            items.push(...this.getSystemTaskCompletions());
        }

        // 3. Macros (Triggered by `)
        if (linePrefix.endsWith('`')) {
            items.push(...this.getMacroCompletions(document));
        }

        // 4. Module & Interface Instantiation
        items.push(...this.getModuleCompletions());
        items.push(...this.getInterfaceCompletions());

        // 5. Internal Variables, Types and Packages
        items.push(...this.getInternalSymbols(document));
        items.push(...this.getPackageCompletions());

        return items;
    }

    private getPackageMemberCompletions(packageName: string): vscode.CompletionItem[] {
        const pkg = this.indexer.getPackage(packageName);
        if (!pkg) return [];

        return pkg.members.map(member => {
            const item = new vscode.CompletionItem(member, vscode.CompletionItemKind.Field);
            item.detail = `Member of package ${packageName}`;
            return item;
        });
    }

    private getInternalSymbols(document: vscode.TextDocument): vscode.CompletionItem[] {
        const text = document.getText();
        const symbolRegex = /\b(reg|wire|logic|integer|genvar|parameter|localparam|typedef\s+struct|typedef\s+enum|typedef\s+union)\s+(?:\[.*?\]\s+)?(\w+)/g;
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
            
            // Advanced snippet with alignment
            const maxPortLen = Math.max(...mod.ports.map(p => p.length), 0);
            const maxParamLen = Math.max(...mod.params.map(p => p.length), 0);

            let snippet = `${mod.name} `;
            if (mod.params.length > 0) {
                snippet += `#(\n`;
                snippet += mod.params.map((p, i) => `    .${p.padEnd(maxParamLen)}(\${${i + 1}:${p}})`).join(',\n');
                snippet += `\n) `;
            }
            snippet += `u_\${${mod.params.length + 1}:${mod.name}} (\n`;
            snippet += mod.ports.map((p, i) => `    .${p.padEnd(maxPortLen)}(\${${mod.params.length + i + 2}:${p}})`).join(',\n');
            snippet += `\n);`;

            item.insertText = new vscode.SnippetString(snippet);
            return item;
        });
    }

    private getInterfaceCompletions(): vscode.CompletionItem[] {
        const interfaces = this.indexer.getInterfaces();
        return interfaces.map(itf => {
            const item = new vscode.CompletionItem(itf.name, vscode.CompletionItemKind.Interface);
            item.detail = 'Interface Instantiation';
            return item;
        });
    }

    private getPackageCompletions(): vscode.CompletionItem[] {
        const packages = this.indexer.getPackages();
        return packages.map(pkg => {
            const item = new vscode.CompletionItem(pkg.name, vscode.CompletionItemKind.Module);
            item.detail = 'Package';
            return item;
        });
    }

    private getSystemTaskCompletions(): vscode.CompletionItem[] {
        const tasks = [
            // Standard Verilog
            { label: 'display', detail: 'Display text', desc: 'Prints formatted text to terminal.' },
            { label: 'write', detail: 'Write text', desc: 'Like $display but without newline.' },
            { label: 'monitor', detail: 'Monitor signals', desc: 'Prints message when signals change.' },
            { label: 'finish', detail: 'End simulation', desc: 'Exits the simulator.' },
            { label: 'stop', detail: 'Pause simulation', desc: 'Suspends simulation execution.' },
            { label: 'time', detail: 'Current time', desc: 'Returns 64-bit current simulation time.' },
            { label: 'stime', detail: 'Current time (short)', desc: 'Returns 32-bit current simulation time.' },
            { label: 'realtime', detail: 'Real time', desc: 'Returns current simulation time as real.' },
            { label: 'random', detail: 'Random number', desc: 'Returns a 32-bit signed random integer.' },
            { label: 'readmemh', detail: 'Read hex memory', desc: 'Loads memory from hex file.' },
            { label: 'readmemb', detail: 'Read binary memory', desc: 'Loads memory from binary file.' },
            // SystemVerilog Extras
            { label: 'bits', detail: 'Bit size', desc: 'Returns number of bits in an expression.' },
            { label: 'typename', detail: 'Type name', desc: 'Returns a string representing the type.' },
            { label: 'unpacked_dimensions', detail: 'Dimensions', desc: 'Returns number of unpacked dimensions.' },
            { label: 'dimensions', detail: 'Dimensions', desc: 'Returns total number of dimensions.' },
            { label: 'cast', detail: 'Dynamic cast', desc: 'Performs check at runtime during casting.' },
            { label: 'unit', detail: 'Compilation unit', desc: 'Refers to the compilation unit scope.' },
            { label: 'root', detail: 'Global scope', desc: 'Refers to the top-level scope.' },
            { label: 'size', detail: 'Array size', desc: 'Returns the number of elements in an array.' }
        ];

        return tasks.map(t => {
            const item = new vscode.CompletionItem(t.label, vscode.CompletionItemKind.Function);
            item.detail = t.detail;
            item.documentation = new vscode.MarkdownString(t.desc);
            return item;
        });
    }

    private getMacroCompletions(document: vscode.TextDocument): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const seen = new Set<string>();

        // Local macros
        const text = document.getText();
        const localMacroRegex = /`define\s+(\w+)/g;
        let match;
        while ((match = localMacroRegex.exec(text)) !== null) {
            const name = match[1];
            if (!seen.has(name)) {
                items.push(new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant));
                seen.add(name);
            }
        }

        // Workspace macros from indexer
        const workspaceMacros = this.indexer.getMacros();
        for (const macro of workspaceMacros) {
            if (!seen.has(macro.name)) {
                const item = new vscode.CompletionItem(macro.name, vscode.CompletionItemKind.Constant);
                item.detail = 'Workspace Macro';
                items.push(item);
                seen.add(macro.name);
            }
        }

        return items;
    }
}
