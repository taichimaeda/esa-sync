import { App, PluginSettingTab, Setting } from "obsidian";
import EsaSyncPlugin from "./main";

export interface EsaSyncSettings {
	mySetting: string;
}

export const DEFAULT_ESA_SYNC_SETTINGS: EsaSyncSettings = {
	mySetting: "default",
};

export class EsaSyncSettingTab extends PluginSettingTab {
	plugin: EsaSyncPlugin;

	constructor(app: App, plugin: EsaSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
