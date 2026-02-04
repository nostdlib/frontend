const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'src', 'assets', 'markdowns');
const rootMd = path.join(__dirname, 'README.md');
const contentDir = path.join(__dirname, 'content');

function ensureDir(dir) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
	ensureDir(path.dirname(dest));
	fs.copyFileSync(src, dest);
	console.log(`Copied: ${src} → ${dest}`);
}

copyFile(rootMd, path.join(assetsDir, 'README.md'));

function copyContentMd(srcDir, destDir) {
	const items = fs.readdirSync(srcDir, { withFileTypes: true });
	for (const item of items) {
		const fullPath = path.join(srcDir, item.name);
		if (item.isDirectory()) {
			console.log(888888,item.name, path.join(destDir, item.name+'/README.md'));
			if (fs.existsSync(fullPath+'/README.md')) {
				copyFile(fullPath+'/README.md', path.join(destDir, item.name+'/README.md')); // recurse
			}
		} 
	}
}

copyContentMd(contentDir, path.join(assetsDir, ''));
