"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const react_1 = __importDefault(require("react"));
const google_1 = require("next/font/google");
require("./globals.css");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
exports.metadata = {
    title: "Deep Trends",
    description: "Automated Perplexity Research Queries",
};
function RootLayout({ children, }) {
    return (<html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen`}>
        {children}
      </body>
    </html>);
}
