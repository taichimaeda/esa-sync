import axios from "axios";
import { Notice, TFile } from "obsidian";
import EsaSyncPlugin from "./main";

interface EsaSyncFrontMatter {
	"esa-sync"?: {
		"post-number"?: number;
		"revision-number"?: number;
		wip?: boolean;
	};
}

export class EsaAPIClient {
	constructor(private plugin: EsaSyncPlugin) {}

	private get axios() {
		const { settings } = this.plugin;

		return axios.create({
			baseURL: `https://api.esa.io/v1/teams/${settings.teamName}`,
			headers: { Authorization: `Bearer ${settings.accessToken}` },
		});
	}

	async createOrUpdatePosts() {
		const { app } = this.plugin;
		const { vault } = this.plugin.app;

		const files = vault.getFiles();
		for (const file of files) {
			app.fileManager.processFrontMatter(
				file,
				(frontmatter: EsaSyncFrontMatter) => {
					const postNumber =
						frontmatter?.["esa-sync"]?.["post-number"];
					const revisionNumber =
						frontmatter?.["esa-sync"]?.["revision-number"];

					if (
						postNumber === undefined &&
						revisionNumber === undefined
					) {
						this.createPost(file, frontmatter);
					} else {
						this.updatePost(file, frontmatter);
					}
				}
			);
		}
	}

	private async createPost(file: TFile, frontmatter: EsaSyncFrontMatter) {
		const { vault } = this.plugin.app;

		const name = file.basename;
		const body = (await vault.read(file)).trim();
		const tags = [...body.matchAll(/#(\w+)/g)].map((match) =>
			// Remove the leading `#`
			match[0].slice(1)
		);
		const category = file.path;
		const wip = frontmatter["esa-sync"]?.wip ?? false;

		const response = await this.axios.post("/posts", {
			post: {
				name,
				body_md: body,
				tags,
				category,
				wip,
			},
		});

		const postNumber = response.data.number;
		const revisionNumber = response.data.revision_number;

		frontmatter["esa-sync"] = {
			"post-number": postNumber,
			"revision-number": revisionNumber,
			wip,
		};
	}

	private async updatePost(file: TFile, frontmatter: EsaSyncFrontMatter) {
		const { vault } = this.plugin.app;

		const name = file.basename;
		const body = (await vault.read(file)).trim();
		const tags = [...body.matchAll(/#(\w+)/g)].map((match) =>
			// Remove the leading `#`
			match[0].slice(1)
		);
		const category = file.path;
		const wip = frontmatter["esa-sync"]?.wip ?? false;
		const postNumber = frontmatter["esa-sync"]?.["post-number"];
		const revisionNumber = frontmatter["esa-sync"]?.["revision-number"];

		if (postNumber === undefined) {
			new Notice(`Post number is missing: ${file.path}`);
			return;
		}
		if (revisionNumber === undefined) {
			new Notice(`Revision number is missing: ${file.path}`);
			return;
		}

		const response = await this.axios.put(`/posts/${postNumber}`, {
			post: {
				name,
				body_md: body,
				tags,
				category,
				wip,
				revision_number: revisionNumber,
			},
		});

		const newRevisionNumber = response.data.revision_number;
		frontmatter["esa-sync"] = {
			"post-number": postNumber,
			"revision-number": newRevisionNumber,
			wip,
		};
	}
}
