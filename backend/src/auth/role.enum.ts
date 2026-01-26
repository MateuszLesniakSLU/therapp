/**
 * Enum definiujący dostępne role użytkowników w systemie.
 * Używany do autoryzacji i kontroli dostępu do zasobów.
 */
export enum Role {
    /** Rola administratora - pełny dostęp do systemu */
    ADMIN = 'admin',

    /** Rola terapeuty - zarządzanie pacjentami i ankietami */
    THERAPIST = 'therapist',

    /** Rola pacjenta - wypełnianie ankiet, przeglądanie historii */
    PATIENT = 'patient',
}
