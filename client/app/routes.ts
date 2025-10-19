import { type RouteConfig, index ,route} from "@react-router/dev/routes";

export default [
    route("","./routes/home.tsx"),
    route("frontend","./routes/frontend-judge/page.jsx"),
    route("frontend/gpt","./routes/frontend-judge/gpt.jsx"),

    route("web3","./routes/web3.judge/page.jsx"),

    route("sql","./routes/db-design-judge/page.jsx"),
] satisfies RouteConfig;
