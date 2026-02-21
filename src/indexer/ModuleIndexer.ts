import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface ModuleInfo {
    name: string;
    ports: string[];
    params: string[];
    uri: vscode.Uri;
}

export interface PackageInfo {
    name: string;
    members: string[];
    uri: vscode.Uri;
}

export interface InterfaceInfo {
    name: string;
    ports: string[];
    uri: vscode.Uri;
}

export interface MacroInfo {
    name: string;
    uri: vscode.Uri;
}

export class ModuleIndexer {
    private moduleCache: Map<string, ModuleInfo> = new Map();
    private packageCache: Map<string, PackageInfo> = new Map();
    private interfaceCache: Map<string, InterfaceInfo> = new Map();
    private macroCache: Map<string, MacroInfo> = new Map();
    private watcher: vscode.FileSystemWatcher | undefined;

    constructor() {}

    public async scanWorkspace() {
        const uris = await vscode.workspace.findFiles('**/*.{v,sv,vh,svh}');
        for (const uri of uris) {
            await this.indexFile(uri);
        }
        this.setupWatcher();
    }

    private setupWatcher() {
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{v,sv,vh,svh}');
        this.watcher.onDidChange(uri => this.indexFile(uri));
        this.watcher.onDidCreate(uri => this.indexFile(uri));
        this.watcher.onDidDelete(uri => {
            this.removeFromCache(uri.fsPath);
        });
    }

    private removeFromCache(fsPath: string) {
        // Simple cleanup - in a real app, you'd track which key came from which file better
        const removeByUri = (cache: Map<string, any>) => {
            for (const [key, info] of cache.entries()) {
                if (info.uri.fsPath === fsPath) cache.delete(key);
            }
        };
        removeByUri(this.moduleCache);
        removeByUri(this.packageCache);
        removeByUri(this.interfaceCache);
        removeByUri(this.macroCache);
    }

    public async indexFile(uri: vscode.Uri) {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const text = content.toString();
            this.extractModules(text, uri);
        } catch (error) {
            console.error(`Error indexing file ${uri.fsPath}:`, error);
        }
    }

    private extractModules(text: string, uri: vscode.Uri) {
        // 1. Extract Modules
        const moduleRegex = /\bmodule\s+(\w+)\s*(?:#\s*\(([\s\S]*?)\))?\s*(?:\(([\s\S]*?)\))?\s*;/g;
        let match;
        while ((match = moduleRegex.exec(text)) !== null) {
            this.moduleCache.set(match[1], {
                name: match[1],
                ports: this.parsePorts(match[3] || ''),
                params: this.parseParams(match[2] || ''),
                uri
            });
        }

        // 2. Extract Packages
        const packageRegex = /\bpackage\s+(\w+)\s*;([\s\S]*?)endpackage/g;
        while ((match = packageRegex.exec(text)) !== null) {
            const members = this.extractPackageMembers(match[2]);
            this.packageCache.set(match[1], { name: match[1], members, uri });
        }

        // 3. Extract Interfaces
        const interfaceRegex = /\binterface\s+(\w+)\s*(?:\(([\s\S]*?)\))?\s*;/g;
        while ((match = interfaceRegex.exec(text)) !== null) {
            this.interfaceCache.set(match[1], {
                name: match[1],
                ports: this.parsePorts(match[2] || ''),
                uri
            });
        }

        // 4. Extract Macros
        const macroRegex = /`define\s+(\w+)/g;
        while ((match = macroRegex.exec(text)) !== null) {
            this.macroCache.set(match[1], { name: match[1], uri });
        }
    }

    private extractPackageMembers(text: string): string[] {
        const members: string[] = [];
        const memberRegex = /\b(function|task|typedef|localparam|parameter)\s+(?:\w+\s+)?(\w+)/g;
        let match;
        while ((match = memberRegex.exec(text)) !== null) {
            members.push(match[2]);
        }
        return members;
    }

    private parseParams(text: string): string[] {
        return text.split(',')
            .map(p => p.trim())
            .map(p => {
                const parts = p.split(/\s+/);
                return parts[parts.length - 2] || ''; // Crude way to get parameter name before '='
            })
            .filter(p => p && !['parameter', 'localparam'].includes(p));
    }

    private parsePorts(text: string): string[] {
        return text.split(',')
            .map(p => p.trim())
            .map(p => {
                const parts = p.split(/\s+/);
                return parts[parts.length - 1] || ''; // Crude way to get port name
            })
            .filter(p => p && !['input', 'output', 'inout', 'wire', 'reg', 'logic'].includes(p));
    }

    public getModules(): ModuleInfo[] {
        return Array.from(this.moduleCache.values());
    }

    public getPackages(): PackageInfo[] {
        return Array.from(this.packageCache.values());
    }

    public getInterfaces(): InterfaceInfo[] {
        return Array.from(this.interfaceCache.values());
    }

    public getMacros(): MacroInfo[] {
        return Array.from(this.macroCache.values());
    }

    public getPackage(name: string): PackageInfo | undefined {
        return this.packageCache.get(name);
    }

    public getModule(name: string): ModuleInfo | undefined {
        return this.moduleCache.get(name);
    }

    public dispose() {
        this.watcher?.dispose();
    }
}
