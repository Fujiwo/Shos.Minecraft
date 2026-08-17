// UMDパターンでNode(検証スクリプト)とブラウザの両方から読み込むための最小限のアンビエント宣言
declare var module: { exports: any } | undefined;
declare function require(id: string): any;
