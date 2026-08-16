# Shos.Minecraft

Minecraft ライクなボクセルゲームの実装リポジトリです。

- 画面・API・永続化を 1 つの ASP.NET Core MVC プロジェクトで統合する構成を採用する。
- HTML/CSS は MVC の `Views/*.cshtml` と `wwwroot` に配置し、`Controller` からレンダリングする。
- アプリ内で画面、API、永続化を責務分離し、`Client/` と `Server/` の分離プロジェクトは作らない。
