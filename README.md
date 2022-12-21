## Resource file Translator for C# MVC Projects

The following project's goal is to simplify and automate translations of C# MVC Resource files.

## Requirements

- Node
- [Google Cloud API key](https://support.google.com/googleapi/answer/6158862?hl=en) With [Translation API](https://cloud.google.com/translate) enabled.

## Setup

In the directory of the project:

1.  Place Resource files.
2.  Enter **API_KEY** in `translator.js` file.
3.  Enter **Routes** where the Resources are located.
4.  Enter **Language codes** for the desired translation languages.
5.  For the first time use run `npm install`
6.  Run `node .\translator.js`

## Parameters

| Parameter | Type     | Description                                                                                                             |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| API_KEY   | String   | API key for Google Cloud with Translation API enabled.                                                                  |
| Routes    | String[] | Array of strings with the paths relative to current directory.                                                          |
| Languages | String[] | Array of [Language Codes](https://cloud.google.com/translate/docs/languages) that are target languages for translation. |

## Workflows

Based on the desired outcome uncomment either `executeFreshTranslate()` or `executeModifiedTranslate()` functions.

### Fresh Translation

Deletes all of the previously translated files and creates new translations.

### Modified Translation

**!IMPORTANT! Translations that were modified by editing the `<value />` tag are not checked.**
Checks for added or deleted entries on the original based on the `<data key={VALUE_TO_CHECK} />` value. Adds missing entries from the original and removes the keys from the translations that are not found in the original.

## Output

The output of the translation is placed in the same directory as the target file is. The files formats that it accounts for are `.resx` and `.cs` files.

For every original `.cs` file an empty file, with the language code appended in it's name, is created. Example: if a target language is Macedonian and a `Common.Designer.cs` file is found, a corresponding `Common.Designer.mk.cs`. The contents of the file are the same, except for the folloring setting `GeneratedCodeAttribute`. For example if it was `App.Resources.Common` it would be changed to `App.Resources.Common.lt`

For every original `.resx` file a file with modified `<data />` tags is created, with the language code appended in it's name. Example: if a target language is Macedonian and a `Common.resx` file is found, a corresponding `Common.mk.resx` file is created, which has the same structure, but different(translated) `<data />` tags.
