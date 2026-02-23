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

        // 6. Classes, Tasks, Functions
        items.push(...this.getClassCompletions());
        items.push(...this.getTaskCompletions());
        items.push(...this.getFunctionCompletions());

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
        const items: vscode.CompletionItem[] = [];
        const seen = new Set<string>();

        // Remove comments and string literals to avoid false positives
        let cleanText = text.replace(/\/\/.*$/gm, '');
        cleanText = cleanText.replace(/\/\*[\s\S]*?\*\//g, '');
        cleanText = cleanText.replace(/"[^"]*"/g, '');

        // Match common Verilog/SystemVerilog declarations
        const declRegex = /\b(input|output|inout|reg|wire|logic|integer|int|bit|byte|shortint|longint|genvar|parameter|localparam|typedef)\b([\s\S]*?)[;)]/g;
        let match;
        while ((match = declRegex.exec(cleanText)) !== null) {
            const keyword = match[1];
            let declBody = match[2];

            // Remove array dimensions [ ... ]
            declBody = declBody.replace(/\[.*?\]/g, ' ');
            // Remove assignments = ... up to the next comma
            declBody = declBody.replace(/=[^,]+/g, ' ');

            const words = declBody.match(/\b[a-zA-Z_]\w*\b/g);
            if (words) {
                for (const word of words) {
                    if (['signed', 'unsigned', 'reg', 'logic', 'wire', 'int', 'bit', 'byte', 'struct', 'enum', 'union', 'type'].includes(word)) {
                        continue;
                    }
                    if (!seen.has(word)) {
                        const item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Variable);
                        item.detail = keyword;
                        items.push(item);
                        seen.add(word);
                    }
                }
            }
        }

        // Loop iterators
        const loopRegex = /\b(?:for|foreach)\s*\(\s*(?:int|integer|genvar)\s+([a-zA-Z_]\w*)/g;
        while ((match = loopRegex.exec(cleanText)) !== null) {
            const word = match[1];
            if (!seen.has(word)) {
                const item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Variable);
                item.detail = 'iterator';
                items.push(item);
                seen.add(word);
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

    private getClassCompletions(): vscode.CompletionItem[] {
        const classes = this.indexer.getClasses();
        return classes.map(cls => {
            const item = new vscode.CompletionItem(cls.name, vscode.CompletionItemKind.Class);
            item.detail = 'Class';
            return item;
        });
    }

    private getTaskCompletions(): vscode.CompletionItem[] {
        const tasks = this.indexer.getTasks();
        return tasks.map(tsk => {
            const item = new vscode.CompletionItem(tsk.name, vscode.CompletionItemKind.Method);
            item.detail = 'Task';
            return item;
        });
    }

    private getFunctionCompletions(): vscode.CompletionItem[] {
        const functions = this.indexer.getFunctions();
        return functions.map(fn => {
            const item = new vscode.CompletionItem(fn.name, vscode.CompletionItemKind.Function);
            item.detail = 'Function';
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
