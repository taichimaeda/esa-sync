# Esa Sync: Obsidian plugin to sync notes with Esa

![workflow](https://github.com/taichimaeda/esa-sync/actions/workflows/ci.yaml/badge.svg)
![semver](https://img.shields.io/badge/semver-1.0.0-blue)

Esa Sync is an Obsidian plugin to sync notes with Esa. It allows you to create and update notes in Esa from Obsidian.

## Getting Started

Before you begin, create a new Esa access token from https://<TEAM_NAME>.esa.io/user/applications

Now you can setup Esa Sync by following the steps below:

1. Install the plugin from the Obsidian settings.
2. Go to the plugin settings and set up your Esa team name and access token.
3. Click the sync button at the top left corner of the Obsidian window.

## Demo

## Caveats

The plugin will override notes in Esa if your note has `esa-post-number` and `esa-revision-number` frontmatter set to some existing values in Esa.
Although this should not be a concern if you just started using Esa Sync (since these frontmatter fields won't be present in your local notes), it is something to keep in mind.

Another point to note is that this plugin **never** calls API to delete notes in Esa - deleting notes in Obsidian will not delete them in Esa.
This is to prevent accidental deletion of notes in Esa, which can lead to data loss for your **entire team**.

## Features

- Create new notes in Esa from Obsidian
- Update existing notes in Esa from Obsidian
    - Avoids unnecessary updates by comparing the hash of the note content
    - Supports frontmatter configurations

## Configurations

You can configure the plugin by setting the following frontmatter in your note:

| Key                   | Type    | Description                      | Default |
| --------------------- | ------- | -------------------------------- | ------- |
| `esa-post-number`     | number  | Esa post number                  | null    |
| `esa-revision-number` | number  | Esa revision number              | null    |
| `esa-wip`             | boolean | Whether the post is WIP or not   | false   |
| `esa-skip`            | boolean | Whether to skip syncing the note | false   |
| `esa-hash`            | string  | Hash of the note content         | null    |

If the type of a number or boolean field is string, the plugin will automatically convert it to the correct type for you.
