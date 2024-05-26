import { App, Modal, Notice, Plugin } from "obsidian";
import {
	DEFAULT_ESA_SYNC_SETTINGS,
	EsaSyncSettings,
	EsaSyncSettingTab,
} from "./settings";

export default class EsaSyncPlugin extends Plugin {
	settings: EsaSyncSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new EsaSyncSettingTab(this.app, this));

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			new Notice("This is a notice!");
		});

		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_ESA_SYNC_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
