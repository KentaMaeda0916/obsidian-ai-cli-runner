# AI CLI Runner

Un plugin [Obsidian](https://obsidian.md) qui exécute des outils AI CLI — Claude Code, aider et d'autres — dans un panneau de terminal directement dans Obsidian.

> **Plateforme :** macOS uniquement (Apple Silicon et Intel). Le support Windows/Linux est prévu.

**[English](../README.md) · [日本語](README.ja.md) · [中文](README.zh.md) · [Español](README.es.md)**

---

## Fonctionnalités

- Panneau de terminal intégré (xterm.js + node-pty) — aucun terminal externe nécessaire
- Lance Claude Code, aider, GitHub Copilot CLI ou tout outil CLI personnalisé
- Sélecteur d'outils + boutons de lancement/arrêt dans une barre d'outils compacte
- Terminal divisé : ouvre plusieurs panneaux côte à côte
- Glisser-déposer des fichiers depuis l'explorateur Obsidian vers le terminal pour insérer leur chemin
- Répertoire de travail automatiquement défini sur le dossier de la note active
- Support du protocole clavier Kitty (requis pour la TUI de Claude Code)
- Entièrement configurable : ajouter, modifier ou supprimer des outils dans les Paramètres

## Prérequis

- macOS (Apple Silicon ou Intel)
- Les outils CLI que vous souhaitez utiliser doivent être installés et disponibles dans le PATH de votre shell (`.zshrc` / `.zprofile`)

## Installation

### Installation manuelle

1. Rendez-vous sur la page [Releases](https://github.com/KentaMaeda0916/obsidian-ai-cli-runner/releases) et téléchargez `obsidian-ai-cli-runner.zip`
2. Extrayez le zip et déplacez le dossier `obsidian-ai-cli-runner` dans `<vault>/.obsidian/plugins/`
3. Rechargez Obsidian et activez le plugin dans **Paramètres → Plugins communautaires**
4. Cliquez sur ▶ pour lancer un outil — le binaire natif requis est téléchargé automatiquement au premier lancement

> Aucune étape de signature de code ou de suppression de quarantaine n'est requise.

## Utilisation

| Action | Comment |
|--------|---------|
| Ouvrir le panneau de terminal | Clic sur l'icône ✨ dans la barre latérale gauche, ou palette de commandes → **Open AI CLI panel** |
| Lancer un outil | Sélectionner dans le menu déroulant → clic sur ▶ |
| Arrêter un outil en cours | Clic sur ■ |
| Diviser le terminal | Clic sur l'icône de colonnes divisées |
| Fermer le panneau | Clic sur l'icône corbeille |
| Insérer un chemin de fichier | Glisser un fichier depuis l'explorateur vers le terminal |

## Configuration

Rendez-vous dans **Paramètres → AI CLI Runner** pour :

- Définir l'outil par défaut qui s'ouvre à la création d'un nouveau panneau
- Ajouter des outils personnalisés (toute commande CLI avec des arguments optionnels)
- Modifier ou supprimer des outils existants

### Exemple : ajouter un outil personnalisé

| Champ | Valeur |
|-------|--------|
| Nom affiché | `My Tool` |
| Commande | `mytool` |
| Arguments | `--flag value` |

## Fonctionnement

Le plugin intègre un PTY (pseudo-terminal) via `node-pty` et le rendu est assuré par `xterm.js`. Chaque outil est lancé via votre shell de connexion (`$SHELL -i -l -c <command>`), de sorte que votre configuration shell (PATH, alias, etc.) est entièrement disponible.

Au premier lancement, un petit binaire natif (`pty.node`) est téléchargé depuis les GitHub Releases du plugin. Cela évite les problèmes de macOS Gatekeeper liés aux binaires pré-signés inclus, et le téléchargement n'a lieu qu'une seule fois.

## Dépannage

**"Failed to download pty binary" au premier lancement**
- Vérifiez votre connexion internet
- Le plugin télécharge un petit binaire natif depuis GitHub au premier lancement — cela n'arrive qu'une seule fois

**"Failed to start \<command\>"**
- Assurez-vous que la commande est installée : exécutez `which <command>` dans Terminal
- Vérifiez qu'elle est dans votre PATH en consultant `.zshrc` ou `.zprofile`

**Shift+Enter ne fonctionne pas**
- Le plugin envoie la séquence d'échappement du protocole clavier Kitty pour Shift+Enter. Assurez-vous d'utiliser une version compatible de l'outil CLI.

## Licence

MIT — voir [LICENSE](../LICENSE)
