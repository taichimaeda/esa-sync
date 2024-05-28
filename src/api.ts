import axios from "axios";
import * as crypto from "crypto";
import { App, getFrontMatterInfo, Modal, Notice, TFile } from "obsidian";
import EsaSyncPlugin from "./main";
// @ts-ignore
import httpAdapter from "axios/lib/adapters/http.js";

interface EsaSyncFrontMatter {
	"esa-post-number"?: number;
	"esa-revision-number"?: number;
	"esa-wip"?: boolean;
	"esa-skip"?: boolean;
	"esa-hash"?: string;
}

export class EsaAPIClient {
	constructor(private plugin: EsaSyncPlugin) {}

	private get axios() {
		const { settings } = this.plugin;

		return axios.create({
			baseURL: `https://api.esa.io/v1/teams/${settings.teamName}`,
			headers: { Authorization: `Bearer ${settings.accessToken}` },
			// NOTE:
			// This is a workaround for the CORS issue.
			adapter: httpAdapter,
		});
	}

	async createOrUpdatePosts() {
		const { app } = this.plugin;
		const { vault } = this.plugin.app;

		const files = vault.getFiles();
		const promises: Promise<void>[] = [];
		const createdFiles: string[] = [];
		const updatedFiles: string[] = [];

		for (const file of files) {
			const promise = (async () => {
				// Read frontmatter
				let frontmatter: EsaSyncFrontMatter = {};
				await app.fileManager.processFrontMatter(file, (value) => {
					Object.assign(frontmatter, this.parseFrontmatter(value));
				});

				const skip = frontmatter["esa-skip"] ?? false;
				if (skip) {
					return;
				}

				const body = await vault.read(file);
				const content = body
					.slice(getFrontMatterInfo(body).contentStart)
					.trim();

				const hash = frontmatter["esa-hash"] ?? "";
				const newHash = crypto
					.createHash("sha256")
					.update(content)
					.digest("hex");
				if (hash === newHash) {
					return;
				}

				const postNumber = frontmatter["esa-post-number"];
				const revisionNumber = frontmatter["esa-revision-number"];
				if (postNumber === undefined && revisionNumber === undefined) {
					// Do not await
					await this.createPost(file, content, frontmatter);
					createdFiles.push(file.path);
				} else {
					// Do not await
					await this.updatePost(file, content, frontmatter);
					updatedFiles.push(file.path);
				}

				// Write frontmatter
				await app.fileManager.processFrontMatter(file, (value) => {
					Object.assign(value, {
						...frontmatter,
						"esa-hash": newHash,
					});
				});
			})();
			promises.push(promise);
		}

		// Wait for sync to be completed:
		await Promise.all(promises);

		const modal = new EsaSyncResultModal(app, createdFiles, updatedFiles);
		modal.open();
	}

	private parseFrontmatter(value: any): EsaSyncFrontMatter {
		const postNumber = value["esa-post-number"];
		const revisionNumber = value["esa-revision-number"];
		const skip = value["esa-skip"];
		const wip = value["esa-wip"];

		if (postNumber !== undefined) {
			value["esa-post-number"] =
				typeof postNumber === "number"
					? postNumber
					: parseInt(postNumber);
		}
		if (revisionNumber !== undefined) {
			value["esa-revision-number"] =
				typeof revisionNumber === "number"
					? revisionNumber
					: parseInt(revisionNumber);
		}
		if (skip !== undefined) {
			value["esa-skip"] = skip || skip === "true";
		}
		if (wip !== undefined) {
			value["esa-wip"] = wip || wip === "true";
		}

		return value;
	}

	private async createPost(
		file: TFile,
		content: string,
		frontmatter: EsaSyncFrontMatter,
	) {
		const name = file.basename;
		const tags = [...content.matchAll(/#(\w+)/g)].map((match) =>
			// Remove the leading `#`
			match[0].slice(1),
		);
		const category = file.path;
		const wip = frontmatter["esa-wip"] ?? false;

		const response = await this.axios.post("/posts", {
			post: {
				name,
				body_md: content,
				tags,
				category,
				wip,
			},
		});

		Object.assign(frontmatter, {
			"esa-post-number": response.data.number,
			"esa-revision-number": response.data.revision_number,
		});
	}

	private async updatePost(
		file: TFile,
		content: string,
		frontmatter: EsaSyncFrontMatter,
	) {
		const name = file.basename;
		const tags = [...content.matchAll(/#(\w+)/g)].map((match) =>
			// Remove the leading `#`
			match[0].slice(1),
		);
		const category = file.path;
		const wip = frontmatter["esa-wip"] ?? false;
		const postNumber = frontmatter["esa-post-number"];
		const revisionNumber = frontmatter["esa-revision-number"];

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
				body_md: content,
				tags,
				category,
				wip,
				revision_number: revisionNumber,
			},
		});

		Object.assign(frontmatter, {
			"esa-post-number": response.data.number,
			"esa-revision-number": response.data.revision_number,
		});
	}
}

export class EsaSyncResultModal extends Modal {
	constructor(
		app: App,
		private readonly createdFiles: string[],
		private readonly updatedFiles: string[],
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Esa Sync" });
		contentEl.createEl("p", { text: "Created the following files:" });
		const createdList = contentEl.createEl("ul");
		for (const file of this.createdFiles) {
			createdList.createEl("li", { text: file });
		}
		contentEl.createEl("p", { text: "Updated the following files:" });
		const updatedList = contentEl.createEl("ul");
		for (const file of this.updatedFiles) {
			updatedList.createEl("li", { text: file });
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
