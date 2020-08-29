const { join } = require('path')
const { cwd } = require('process')

const fs = require('fs-extra')
const readdirp = require('readdirp')
const matter = require('gray-matter')
const { Edge } = require('edge.js')
const Markdown = require('@dimerapp/markdown')

const contentsPath = join(cwd(), 'contents')
const pagesPath = join(cwd(), 'pages')
const buildPath = join(cwd(), 'build')
const guidesPath = join(contentsPath, 'guides')

/**
 * Build all static Edge pages.
 */
async function buildEdgePages() {
	const edge = new Edge({ cache: false })
	edge.mount(pagesPath)

	for await (const entry of readdirp(pagesPath)) {
		if (entry.path.startsWith('_')) {
			continue
		}

		const html = edge.render(entry.path)

		await fs.outputFile(
			join(buildPath, entry.path.replace(/\.edge/, '.html')),
			html
		)
	}
}

/**
 * Build all pages from their markdown files.
 */
async function buildGuidePages() {
	const edge = new Edge({ cache: false })
	edge.mount(pagesPath)

	for await (const entry of readdirp(guidesPath)) {
		const source = await fs.readFile(entry.fullPath)
		const { data: frontMatter, content } = matter(source)
		const markdown = new Markdown(content, { skipToc: true })
		const { contents } = await markdown.toHTML()

		const html = edge.render(`_guides.edge`, {
			frontMatter,
			content: contents,
		})

		await fs.outputFile(
			join(buildPath, `${frontMatter.permalink}.html`),
			html
		)
	}
}

;(async () => {
	await buildEdgePages()
	await buildGuidePages()
})()