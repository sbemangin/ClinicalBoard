Option Explicit
Dim etude,site
' Chemin du dossier contenant les fichiers .eml
Dim emlFolderPath
etude = WScript.Arguments(0)
site = WScript.Arguments(1)
emlFolderPath = "C:\Users\a_mangin\Documents\SERVER3\www\relance\" & etude & "\"

' Fonction pour lister les fichiers .eml dans le dossier
Function ListEmlFiles(folderPath)
    Dim fso, folder, file, emlFiles
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set folder = fso.GetFolder(folderPath)
    emlFiles = ""

    ' Parcourir les fichiers du dossier
    For Each file In folder.Files
        If LCase(fso.GetExtensionName(file.Name)) = "eml" Then
            emlFiles = emlFiles & file.Path & vbCrLf
        End If
    Next

    ListEmlFiles = emlFiles
End Function

' Fonction pour corriger les anomalies d'accents
Function FixAccents(str)
    str = Replace(str, "é", "�")
    str = Replace(str, "è", "�")
    str = Replace(str, "ê", "�")
    str = Replace(str, "ç", "�")
    str = Replace(str, "�", "�")
    str = Replace(str, "�", "�")
    str = Replace(str, "ù", "�")
    str = Replace(str, "–", "�") ' Correction pour le tiret
    str = Replace(str, "“", "�") ' Correction pour les guillemets
    str = Replace(str, "�", "�") ' Correction pour le symbole euro
	str = Replace(str, "°", "�") ' Correction pour le symbole euro
	
    ' Ajouter d'autres remplacements si n�cessaire
    FixAccents = str
End Function

' Fonction pour cr�er un email et le sauvegarder en .msg
Sub CreateAndSaveEmail(emlFilePath)
    Dim subject, sender, recipients, body, fso, file, line, mcc
    Dim isBody, bodyStartLine

    ' Cr�er l'objet FileSystemObject
    Set fso = CreateObject("Scripting.FileSystemObject")

    ' Ouvrir le fichier .eml
    Set file = fso.OpenTextFile(emlFilePath, 1)

    ' Initialiser les variables
    isBody = False
    body = ""
    bodyStartLine = 0

    ' Lire le contenu du fichier ligne par ligne
    Do While Not file.AtEndOfStream
        line = file.ReadLine
        
        If InStr(line, "Subject:") > 0 Then
            subject = Trim(Mid(line, Len("Subject:") + 1))
        ElseIf InStr(line, "From:") > 0 Then
            sender = Trim(Mid(line, Len("From:") + 1))
        ElseIf InStr(line, "To:") > 0 Then
            recipients = Trim(Mid(line, Len("To:") + 1))
		ElseIf InStr(line, "Cc:") > 0 Then
            mcc = Trim(Mid(line, Len("Cc:") + 1))
        ElseIf bodyStartLine >= 8 Then
            body = body & line & vbCrLf
        End If
        
        ' Incr�menter le compteur de lignes
        bodyStartLine = bodyStartLine + 1
    Loop

    ' Fermer le fichier
    file.Close

    ' Corriger les accents dans le sujet et le corps
    subject = FixAccents(subject)
    body = FixAccents(body)

    ' Cr�er une instance d'Outlook
    Dim outlookApp, newMail, msgFilePath
    Set outlookApp = CreateObject("Outlook.Application")

    ' Cr�er un nouvel email
    Set newMail = outlookApp.CreateItem(0) ' 0 repr�sente olMailItem

    ' Remplir le nouvel email avec les donn�es extraites
    With newMail
        .To = recipients
		.Cc = mcc
        .Subject = subject
        .HTMLBody = body ' Utiliser le corps en HTML

        ' Chemin pour sauvegarder le fichier .msg
        msgFilePath = Replace(emlFilePath, ".eml", ".msg")
        .SaveAs msgFilePath, 3 ' 3 repr�sente le format Outlook .msg
		'.Send
	.Display
    End With
   ' Set fso = CreateObject("Scripting.FileSystemObject")
   ' If fso.FileExists(emlFilePath) Then
   '     fso.DeleteFile(emlFilePath)
    'End If
    ' Lib�rer les objets
    Set newMail = Nothing
    Set outlookApp = Nothing
    Set file = Nothing
    Set fso = Nothing
End Sub

dim mail
mail=emlFolderPath & etude & "_" & site & ".eml"
CreateAndSaveEmail(mail)
