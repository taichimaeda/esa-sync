import { App, PluginSettingTab, Setting } from 'obsidian';
import EsaSyncPlugin from './main';

export interface EsaSyncSettings {
	accessToken: string;
	teamName: string;
}

export const DEFAULT_ESA_SYNC_SETTINGS: EsaSyncSettings = {
	accessToken: '',
	teamName: '',
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
			.setName('Team name')
			.setDesc('The name of the team you want to sync with')
			.addText((text) =>
				text
					.setPlaceholder('Team name')
					.setValue(this.plugin.settings.teamName)
					.onChange(async (value) => {
						this.plugin.settings.teamName = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Access Token')
			.setDesc('Your personal access token for the ESA API')
			.addText((text) =>
				text
					.setPlaceholder('Access Token')
					.setValue(this.plugin.settings.accessToken)
					.onChange(async (value) => {
						this.plugin.settings.accessToken = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
