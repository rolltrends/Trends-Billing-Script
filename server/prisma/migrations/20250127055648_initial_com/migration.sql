BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Chat] ADD [timestamp] DATETIME2 NOT NULL CONSTRAINT [Chat_timestamp_df] DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE [dbo].[Message] ADD [timestamp] DATETIME2 NOT NULL CONSTRAINT [Message_timestamp_df] DEFAULT CURRENT_TIMESTAMP;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
