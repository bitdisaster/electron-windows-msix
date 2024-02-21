export class WindowsVersion {
    public major: number;
    public minor: number;
    public patch: number;
    public build: number;

    constructor(version: string) {
        const array = version.split('.');
        if(array.length != 4) {
            throw new Error(`Invalid Windows version string. {${version}}`);
        }
        this.major = Number.parseInt(array[0], 10);
        this.minor = Number.parseInt(array[1], 10);
        this.patch = Number.parseInt(array[2], 10);
        this.build = Number.parseInt(array[3], 10);
    }

    public toString = () : string => `${this.major}.${this.minor}.${this.patch}.${this.build}`;

    public equals(other: WindowsVersion) {
        if(this.major < other.major) return -1;
        if(this.major > other.major) return 1;

        if(this.minor < other.minor) return -1;
        if(this.minor > other.minor) return 1;

        if(this.patch < other.patch) return -1;
        if(this.patch > other.patch) return 1;

        if(this.build < other.build) return -1;
        if(this.build > other.build) return 1;

        return 0;
    }

    public static IsOlder(v1: string, v2: string) {
        const wv1 = new WindowsVersion(v1);
        const wv2 = new WindowsVersion(v2);
        return wv1.equals(wv2) === -1;
    }

    public static IsNewer(v1: string, v2: string) {
        const wv1 = new WindowsVersion(v1);
        const wv2 = new WindowsVersion(v2);
        return wv1.equals(wv2) === 1;
    }

    public static IsSame(v1: string, v2: string) {
        const wv1 = new WindowsVersion(v1);
        const wv2 = new WindowsVersion(v2);
        return wv1.equals(wv2) === 0;
    }
}
