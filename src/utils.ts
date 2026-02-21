export function expandEnvironmentVariables(text: string): string {
    return text.replace(/\$\{env:([^}]+)\}/g, (_, name) => {
        return process.env[name] || '';
    });
}
