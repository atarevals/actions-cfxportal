/**
 * Parse YAML array from environment variable
 * Supports both YAML array format and multiline format
 * 
 * Examples:
 * - "[file1.js, file2.js, src/]"
 * - "- file1.js\n- file2.js\n- src/"
 * - "file1.js\nfile2.js\nsrc/"
 */
export function parseYamlArray(value: string | undefined): string[] {
	if (!value || value.trim() === '') {
		return [];
	}

	const trimmed = value.trim();

	// Handle YAML array format: [item1, item2, item3]
	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		const content = trimmed.slice(1, -1);
		return content
			.split(',')
			.map(item => item.trim())
			.filter(item => item.length > 0);
	}

	// Handle YAML list format with dashes or simple multiline
	const lines = trimmed.split('\n').map(line => line.trim());
	const result: string[] = [];

	for (const line of lines) {
		if (line.startsWith('- ')) {
			// YAML list item format
			const item = line.substring(2).trim();
			if (item.length > 0) {
				result.push(item);
			}
		} else if (line.length > 0) {
			// Simple line format
			result.push(line);
		}
	}

	return result.filter(item => item.length > 0);
}
