public static class AgeCalculator
{
    public static int? Calculate(DateTime? dateOfBirth)
    {
        if (dateOfBirth is null)
        {
            return null;
        }

        var today = DateTime.UtcNow.Date;
        var dob = dateOfBirth.Value.Date;
        var age = today.Year - dob.Year;
        if (dob > today.AddYears(-age))
        {
            age--;
        }

        return age;
    }
}
