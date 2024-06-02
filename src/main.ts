import { shell } from 'electron';
import { addIcon, Notice, Plugin, TFile } from 'obsidian';
import { EsaAPIClient } from './api';
import esaIcon from './icons/esa.svg';
import {
	DEFAULT_ESA_SYNC_SETTINGS,
	EsaSyncSettings,
	EsaSyncSettingTab,
} from './settings';

export interface EsaSyncFrontMatter {
	'esa-post-number'?: number;
	'esa-revision-number'?: number;
	'esa-wip'?: boolean;
	'esa-skip'?: boolean;
	'esa-hash'?: string;
}

export default class EsaSyncPlugin extends Plugin {
	apiClient: EsaAPIClient;
	settings: EsaSyncSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new EsaSyncSettingTab(this.app, this));

		this.registerCustomIcons();

		this.apiClient = new EsaAPIClient(this);

		this.addRibbonIcon('esa', 'Sync notes to esa', () => this.handleSync());
		this.addCommand({
			id: 'sync-notes-to-esa',
			name: 'Sync notes to esa',
			callback: () => this.handleSync(),
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle('Open in esa')
						.onClick(() => this.handleOpen(file as TFile));
				});
			}),
		);
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				menu.addItem((item) => {
					item
						.setTitle('Open in esa')
						.onClick(() => this.handleOpen(view.file as TFile));
				});
			}),
		);
	}

	private registerCustomIcons() {
		addIcon('esa', esaIcon);
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
			new Notice('Please configure your settings before syncing notes to esa');
			return;
		}
		new Notice('Syncing your notes to esa...');
		try {
			await this.apiClient.createOrUpdatePosts();
		} catch (error) {
			console.error(error);
			new Notice('Failed to sync notes to esa');
			return;
		}
		new Notice('Successfully synced your notes to esa!');
	}

	private async handleOpen(file: TFile) {
		// Read frontmatter
		let frontmatter: EsaSyncFrontMatter = {};
		await this.app.fileManager.processFrontMatter(file, (value) => {
			frontmatter = value;
		});

		const teamName = this.settings.teamName;
		const postNumber = frontmatter['esa-post-number'];
		shell.openExternal(`https://${teamName}.esa.io/posts/${postNumber}`);
	}
}
