export class Project {
    id: string = "";
    name: string = "";
    summary: string = "";
    background: string | null = null;
    description: boolean = false;
    homepage: string | null = null;
    sourceCode: string | null = null;
    curseforge: string | null = null;
    downloads: string | null = null;
    modrinth: string | null = null;
    planetMc: string | null = null;
    deprecated: boolean = false;
    comingSoon: boolean = false;
    new: boolean = false;
    descriptionText: string = "";
    stage: "alpha" | "beta" | "release" = "release";
    sussy: boolean = false;
    version: string = "0.0.0";
}

export class ProjectRef {
    id: string = "";
    name: string = "";
    summary: string = "";
    category: string = "";
    icon: string = "";
    app: string = "none";
}
