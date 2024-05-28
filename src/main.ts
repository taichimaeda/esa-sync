import { addIcon, Notice, Plugin } from "obsidian";
import { EsaAPIClient } from "./api";
import esaIcon from "./icons/esa.svg";
import {
	DEFAULT_ESA_SYNC_SETTINGS,
	EsaSyncSettings,
	EsaSyncSettingTab,
} from "./settings";

export default class EsaSyncPlugin extends Plugin {
	apiClient: EsaAPIClient;
	settings: EsaSyncSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new EsaSyncSettingTab(this.app, this));

		this.registerCustomIcons();

		this.apiClient = new EsaAPIClient(this);
		this.addRibbonIcon("esa", "Sync notes to esa", () => this.handleSync());
		this.addCommand({
			id: "sync-notes-to-esa",
			name: "Sync notes to esa",
			callback: () => this.handleSync(),
		});
	}

	private registerCustomIcons() {
		addIcon("esa", esaIcon);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_ESA_SYNC_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleSync() {
		if (!this.settings.accessToken || !this.settings.teamName) {
			new Notice(
				"Please configure your settings before syncing notes to esa",
			);
			return;
		}
		new Notice("Syncing your notes to esa...");
		try {
			await this.apiClient.createOrUpdatePosts();
		} catch (error) {
			console.error(error);
			new Notice("Failed to sync notes to esa");
			return;
		}
		new Notice("Successfully synced your notes to esa!");
	}
}
