import User from "../models/user-model"

export const deleteOutOfBoundsUsers = async () => {
    try{
        const now = new Date()
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 days 

        //? for testing, use 15 mins
        // const fifteenMinutesAgo = new Date(now.getTime() -15 * 60 * 1000) 

        //? delete users whose createdAt date is older than 15 days
        const result = await User.deleteMany({
            deletedAt: {
                $lt: fifteenDaysAgo
            }
        })

        console.log(`Deleted ${result.deletedCount} users`)
    } catch (error) {
       console.error('Error deleting out-of-bounds users:', error);
    }
}