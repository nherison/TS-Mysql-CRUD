export interface TeamName {
	sport: string,
	base: string,
	[bookie:string]: string | undefined
}

export interface AppConfigOptions {
	db: {
		dbHost: string,
		dbUser: string,
		dbPwd: string,
		dbName: string
	},
	mockup: {
		bookies: string[],
		teamNames: TeamName[] | undefined
	}
}