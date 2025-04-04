BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [sid] NVARCHAR(1000) NOT NULL,
    [data] VARCHAR(max) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_sid_key] UNIQUE NONCLUSTERED ([sid])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
