import * as vscode from 'vscode';

// ──────────────────────────────────────────────────────────────────────────────
// Palette definitions
// ──────────────────────────────────────────────────────────────────────────────

interface TextMateRule {
    scope: string[];
    settings: { foreground: string; fontStyle?: string };
}

// ── 16-color Dark ──────────────────────────────────────────────────────────────
const PALETTE_16_DARK: TextMateRule[] = [
    { scope: ["storage.type.module", "storage.type.interface", "storage.type.class", "storage.type.package", "storage.type.program", "storage.type.udp"], settings: { foreground: "#89DCEB", fontStyle: "bold" } },
    { scope: ["storage.type.function", "storage.type.task"], settings: { foreground: "#89B4FA", fontStyle: "bold" } },
    { scope: ["keyword.control.verilog", "keyword.control.systemverilog"], settings: { foreground: "#F38BA8" } },
    { scope: ["keyword.control.block.systemverilog", "keyword.control.block.verilog", "keyword.other.block.verilog", "keyword.other.block.systemverilog"], settings: { foreground: "#CBA6F7" } },
    { scope: ["keyword.other.port.verilog", "keyword.other.port.systemverilog"], settings: { foreground: "#FAB387", fontStyle: "bold" } },
    { scope: ["storage.type.built-in.systemverilog", "storage.type.built-in.verilog", "support.type.verilog", "support.type.systemverilog"], settings: { foreground: "#74C7EC" } },
    { scope: ["storage.modifier.systemverilog", "storage.modifier.verilog"], settings: { foreground: "#F5C2E7" } },
    { scope: ["support.function.builtin.verilog", "support.function.builtin.systemverilog", "entity.name.function.call.system.verilog", "entity.name.function.call.system.systemverilog"], settings: { foreground: "#F9E2AF", fontStyle: "bold" } },
    { scope: ["entity.name.function.preprocessor.verilog", "entity.name.function.preprocessor.systemverilog", "keyword.other.compiler-directive.verilog", "keyword.other.compiler-directive.systemverilog"], settings: { foreground: "#CBA6F7", fontStyle: "italic" } },
    { scope: ["support.class.uvm.systemverilog"], settings: { foreground: "#A6E3A1" } },
    { scope: ["support.function.uvm.systemverilog"], settings: { foreground: "#94E2D5" } },
    { scope: ["constant.numeric.integer.verilog", "constant.numeric.integer.systemverilog", "constant.numeric.float.verilog", "constant.numeric.float.systemverilog"], settings: { foreground: "#B5CEA8" } },
    { scope: ["constant.numeric.size.verilog", "constant.numeric.size.systemverilog"], settings: { foreground: "#F5C2E7" } },
    { scope: ["constant.numeric.base.verilog", "constant.numeric.base.systemverilog"], settings: { foreground: "#FAB387" } },
    { scope: ["constant.numeric.digit.verilog", "constant.numeric.digit.systemverilog", "constant.numeric.sized-integer.verilog", "constant.numeric.sized-integer.systemverilog"], settings: { foreground: "#B5CEA8" } },
    { scope: ["constant.numeric.special.verilog", "constant.numeric.special.systemverilog"], settings: { foreground: "#F38BA8" } },
    { scope: ["constant.other.parameter.verilog", "constant.other.parameter.systemverilog"], settings: { foreground: "#EBA0AC" } },
    { scope: ["keyword.operator.comparison.verilog", "keyword.operator.comparison.systemverilog"], settings: { foreground: "#F38BA8" } },
    { scope: ["keyword.operator.assignment.verilog", "keyword.operator.assignment.systemverilog"], settings: { foreground: "#89B4FA" } },
    { scope: ["keyword.operator.bitwise.verilog", "keyword.operator.bitwise.systemverilog", "keyword.operator.arithmetic.verilog", "keyword.operator.arithmetic.systemverilog", "keyword.operator.logical.verilog", "keyword.operator.logical.systemverilog"], settings: { foreground: "#89DCEB" } },
    { scope: ["string.quoted.double.verilog", "string.quoted.double.systemverilog"], settings: { foreground: "#A6E3A1" } },
    { scope: ["comment.block.verilog", "comment.line.verilog", "comment.block.systemverilog", "comment.line.double-slash.systemverilog"], settings: { foreground: "#585B70", fontStyle: "italic" } },
];

// ── 16-color Light ─────────────────────────────────────────────────────────────
const PALETTE_16_LIGHT: TextMateRule[] = [
    { scope: ["storage.type.module", "storage.type.interface", "storage.type.class", "storage.type.package", "storage.type.program", "storage.type.udp"], settings: { foreground: "#006080", fontStyle: "bold" } },
    { scope: ["storage.type.function", "storage.type.task"], settings: { foreground: "#0550AE", fontStyle: "bold" } },
    { scope: ["keyword.control.verilog", "keyword.control.systemverilog"], settings: { foreground: "#AF00DB" } },
    { scope: ["keyword.control.block.systemverilog", "keyword.control.block.verilog", "keyword.other.block.verilog", "keyword.other.block.systemverilog"], settings: { foreground: "#6F42C1" } },
    { scope: ["keyword.other.port.verilog", "keyword.other.port.systemverilog"], settings: { foreground: "#C24F1A", fontStyle: "bold" } },
    { scope: ["storage.type.built-in.systemverilog", "storage.type.built-in.verilog", "support.type.verilog", "support.type.systemverilog"], settings: { foreground: "#267F99" } },
    { scope: ["storage.modifier.systemverilog", "storage.modifier.verilog"], settings: { foreground: "#811F3F" } },
    { scope: ["support.function.builtin.verilog", "support.function.builtin.systemverilog", "entity.name.function.call.system.verilog", "entity.name.function.call.system.systemverilog"], settings: { foreground: "#795E26", fontStyle: "bold" } },
    { scope: ["entity.name.function.preprocessor.verilog", "entity.name.function.preprocessor.systemverilog", "keyword.other.compiler-directive.verilog", "keyword.other.compiler-directive.systemverilog"], settings: { foreground: "#6F42C1", fontStyle: "italic" } },
    { scope: ["support.class.uvm.systemverilog"], settings: { foreground: "#1A7432" } },
    { scope: ["support.function.uvm.systemverilog"], settings: { foreground: "#0E7490" } },
    { scope: ["constant.numeric.integer.verilog", "constant.numeric.integer.systemverilog", "constant.numeric.float.verilog", "constant.numeric.float.systemverilog"], settings: { foreground: "#098658" } },
    { scope: ["constant.numeric.size.verilog", "constant.numeric.size.systemverilog"], settings: { foreground: "#811F3F" } },
    { scope: ["constant.numeric.base.verilog", "constant.numeric.base.systemverilog"], settings: { foreground: "#C24F1A" } },
    { scope: ["constant.numeric.digit.verilog", "constant.numeric.digit.systemverilog", "constant.numeric.sized-integer.verilog", "constant.numeric.sized-integer.systemverilog"], settings: { foreground: "#098658" } },
    { scope: ["constant.numeric.special.verilog", "constant.numeric.special.systemverilog"], settings: { foreground: "#AF00DB" } },
    { scope: ["constant.other.parameter.verilog", "constant.other.parameter.systemverilog"], settings: { foreground: "#9A0000" } },
    { scope: ["keyword.operator.comparison.verilog", "keyword.operator.comparison.systemverilog"], settings: { foreground: "#C00000" } },
    { scope: ["keyword.operator.assignment.verilog", "keyword.operator.assignment.systemverilog"], settings: { foreground: "#0550AE" } },
    { scope: ["keyword.operator.bitwise.verilog", "keyword.operator.bitwise.systemverilog", "keyword.operator.arithmetic.verilog", "keyword.operator.arithmetic.systemverilog", "keyword.operator.logical.verilog", "keyword.operator.logical.systemverilog"], settings: { foreground: "#267F99" } },
    { scope: ["string.quoted.double.verilog", "string.quoted.double.systemverilog"], settings: { foreground: "#A31515" } },
    { scope: ["comment.block.verilog", "comment.line.verilog", "comment.block.systemverilog", "comment.line.double-slash.systemverilog"], settings: { foreground: "#6A9955", fontStyle: "italic" } },
];

// ── All scopes used (for merging into 4-color groups) ──────────────────────────
const KEYWORD_SCOPES = [
    "storage.type.module", "storage.type.interface", "storage.type.class", "storage.type.package", "storage.type.program", "storage.type.udp",
    "storage.type.function", "storage.type.task",
    "keyword.control.verilog", "keyword.control.systemverilog",
    "keyword.control.block.systemverilog", "keyword.control.block.verilog", "keyword.other.block.verilog", "keyword.other.block.systemverilog",
    "keyword.other.port.verilog", "keyword.other.port.systemverilog",
    "storage.modifier.systemverilog", "storage.modifier.verilog",
    "entity.name.function.preprocessor.verilog", "entity.name.function.preprocessor.systemverilog",
    "keyword.other.compiler-directive.verilog", "keyword.other.compiler-directive.systemverilog",
];

const TYPE_SCOPES = [
    "storage.type.built-in.systemverilog", "storage.type.built-in.verilog",
    "support.type.verilog", "support.type.systemverilog",
    "support.class.uvm.systemverilog", "support.function.uvm.systemverilog",
    "support.function.builtin.verilog", "support.function.builtin.systemverilog",
    "entity.name.function.call.system.verilog", "entity.name.function.call.system.systemverilog",
];

const CONSTANT_SCOPES = [
    "constant.numeric.integer.verilog", "constant.numeric.integer.systemverilog",
    "constant.numeric.float.verilog", "constant.numeric.float.systemverilog",
    "constant.numeric.size.verilog", "constant.numeric.size.systemverilog",
    "constant.numeric.base.verilog", "constant.numeric.base.systemverilog",
    "constant.numeric.digit.verilog", "constant.numeric.digit.systemverilog",
    "constant.numeric.sized-integer.verilog", "constant.numeric.sized-integer.systemverilog",
    "constant.numeric.special.verilog", "constant.numeric.special.systemverilog",
    "constant.other.parameter.verilog", "constant.other.parameter.systemverilog",
    "keyword.operator.comparison.verilog", "keyword.operator.comparison.systemverilog",
    "keyword.operator.assignment.verilog", "keyword.operator.assignment.systemverilog",
    "keyword.operator.bitwise.verilog", "keyword.operator.bitwise.systemverilog",
    "keyword.operator.arithmetic.verilog", "keyword.operator.arithmetic.systemverilog",
    "keyword.operator.logical.verilog", "keyword.operator.logical.systemverilog",
];

const COMMENT_STRING_SCOPES = [
    "string.quoted.double.verilog", "string.quoted.double.systemverilog",
    "comment.block.verilog", "comment.line.verilog",
    "comment.block.systemverilog", "comment.line.double-slash.systemverilog",
];

// ── 4-color Dark ───────────────────────────────────────────────────────────────
const PALETTE_4_DARK: TextMateRule[] = [
    { scope: KEYWORD_SCOPES, settings: { foreground: "#C586C0" } },
    { scope: TYPE_SCOPES, settings: { foreground: "#4EC9B0" } },
    { scope: CONSTANT_SCOPES, settings: { foreground: "#B5CEA8" } },
    { scope: COMMENT_STRING_SCOPES, settings: { foreground: "#6A9955", fontStyle: "italic" } },
];

// ── 4-color Light ──────────────────────────────────────────────────────────────
const PALETTE_4_LIGHT: TextMateRule[] = [
    { scope: KEYWORD_SCOPES, settings: { foreground: "#AF00DB" } },
    { scope: TYPE_SCOPES, settings: { foreground: "#267F99" } },
    { scope: CONSTANT_SCOPES, settings: { foreground: "#098658" } },
    { scope: COMMENT_STRING_SCOPES, settings: { foreground: "#6A9955", fontStyle: "italic" } },
];

// ──────────────────────────────────────────────────────────────────────────────
// HighlightManager
// ──────────────────────────────────────────────────────────────────────────────
export class HighlightManager implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Verilog Highlight');

        // Apply on activation
        this.applyHighlight();

        // Listen for theme changes
        this.disposables.push(
            vscode.window.onDidChangeActiveColorTheme(() => {
                this.outputChannel.appendLine('[HighlightManager] Theme changed, re-applying highlight...');
                this.applyHighlight();
            })
        );

        // Listen for configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('verilogLinter.highlight.colorMode')) {
                    this.outputChannel.appendLine('[HighlightManager] Color mode setting changed, re-applying...');
                    this.applyHighlight();
                }
            })
        );
    }

    /**
     * Determine the current palette and write it into
     * `editor.tokenColorCustomizations` at the global (User) scope.
     */
    async applyHighlight(): Promise<void> {
        const config = vscode.workspace.getConfiguration('verilogLinter.highlight');
        const mode: string = config.get<string>('colorMode', '16color');

        if (mode === 'off') {
            await this.clearHighlight();
            this.outputChannel.appendLine('[HighlightManager] Highlight mode is OFF – cleared custom rules.');
            return;
        }

        const isDark = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
            || vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

        let palette: TextMateRule[];
        let label: string;

        if (mode === '4color') {
            palette = isDark ? PALETTE_4_DARK : PALETTE_4_LIGHT;
            label = `4color-${isDark ? 'dark' : 'light'}`;
        } else {
            palette = isDark ? PALETTE_16_DARK : PALETTE_16_LIGHT;
            label = `16color-${isDark ? 'dark' : 'light'}`;
        }

        // Read existing customizations so we don't overwrite user's non-Verilog rules
        const editorConfig = vscode.workspace.getConfiguration('editor');
        const existing = editorConfig.get<Record<string, unknown>>('tokenColorCustomizations') || {};

        // Merge: keep user's rules for other scopes, replace Verilog rules
        const existingRules = (existing as any).textMateRules as TextMateRule[] | undefined;
        const nonVerilogRules = (existingRules || []).filter(
            (rule) => !this.isVerilogRule(rule)
        );

        const merged = {
            ...existing,
            textMateRules: [...nonVerilogRules, ...palette],
        };

        await editorConfig.update('tokenColorCustomizations', merged, vscode.ConfigurationTarget.Global);
        this.outputChannel.appendLine(`[HighlightManager] Applied palette: ${label} (${palette.length} rules)`);
    }

    /**
     * Remove all Verilog-specific textMateRules, restoring the user's original theme.
     */
    async clearHighlight(): Promise<void> {
        const editorConfig = vscode.workspace.getConfiguration('editor');
        const existing = editorConfig.get<Record<string, unknown>>('tokenColorCustomizations') || {};
        const existingRules = (existing as any).textMateRules as TextMateRule[] | undefined;

        if (!existingRules || existingRules.length === 0) {
            return;
        }

        const nonVerilogRules = existingRules.filter(
            (rule) => !this.isVerilogRule(rule)
        );

        if (nonVerilogRules.length === 0) {
            // Remove the entire key if no rules remain
            const { textMateRules: _, ...rest } = existing as any;
            const cleanedObj = Object.keys(rest).length > 0 ? rest : undefined;
            await editorConfig.update('tokenColorCustomizations', cleanedObj, vscode.ConfigurationTarget.Global);
        } else {
            await editorConfig.update('tokenColorCustomizations', {
                ...existing,
                textMateRules: nonVerilogRules,
            }, vscode.ConfigurationTarget.Global);
        }
    }

    /**
     * Check if a textMateRule belongs to Verilog scopes.
     */
    private isVerilogRule(rule: TextMateRule): boolean {
        if (!rule.scope || !Array.isArray(rule.scope)) {
            return false;
        }
        return rule.scope.some(
            (s) => s.endsWith('.verilog') || s.endsWith('.systemverilog')
                || s.startsWith('storage.type.module') || s.startsWith('storage.type.interface')
                || s.startsWith('storage.type.class') || s.startsWith('storage.type.package')
                || s.startsWith('storage.type.program') || s.startsWith('storage.type.udp')
                || s.startsWith('storage.type.function') || s.startsWith('storage.type.task')
        );
    }

    dispose(): void {
        // Clean up Verilog highlight rules when extension deactivates
        this.clearHighlight();
        this.disposables.forEach((d) => d.dispose());
        this.outputChannel.dispose();
    }
}
