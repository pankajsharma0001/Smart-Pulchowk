export interface registerStudentForEventInput{
    authStudentId: string,
    eventId: number
}

export interface CreateEventInput{
    
        title: string;
        description?: string;
        eventType: string;
        venue?: string;
        maxParticipants?: number;
        registrationDeadline: Date;
        eventStartTime: Date;
        eventEndTime: Date;
        bannerUrl?: string;

}

export interface createClubInput {
    name: string;
    description?: string;
    email: string;
    logoUrl?: string;
}