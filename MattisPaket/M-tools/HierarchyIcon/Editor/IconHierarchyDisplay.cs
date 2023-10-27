#if (UNITY_EDITOR)

using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;
using System;

// I Unity kan man sätta lables och iconer som visas som Gizmos i scenen etc osv.
// Detta script petar in dem i hierarki-listan också
// Man kan också regga koppling mellan Go och Icon via komponenter på objekten.

[InitializeOnLoad]
public static class IconHierarchyDisplay
{
	private static bool useOverrideIcons;
	private static HierarchyIconSettings settings = new HierarchyIconSettings();
	private static bool show { get => settings.Show;}
	private static Color disabledColor = new Color(1f, 1f, 1f, 0.5f);

	// Needed for the settings wizard.
	public static HierarchyIconSettings GetSettingsCopy { get { return settings.ShallowCopy(); } }
	public static HierarchyIconSettings SetSettings { set { settings = value; UpdateState(); } }
	private static bool test = false;
	static IconHierarchyDisplay()
	{
		ReadPersistentState();
		UpdateState();
	}

	private static void ReadPersistentState()
	{
		
		if (EditorPrefs.HasKey("IconSettingsJson"))
		{
			try
			{
				string json = EditorPrefs.GetString("IconSettingsJson");
				settings = JsonUtility.FromJson<HierarchyIconSettings>(json);
//				Debug.Log("Got settings from Json."+json);
			}
			catch (Exception)
			{

				Debug.LogWarning("Invalid Json.");
			}
			
		}

	}

	[MenuItem("M-Tools/HierarcyIcon/ClearEditorPrefs",false,2)]
	private static void ClearEditorPrefs()
	{
		EditorPrefs.DeleteKey("IconSettingsJson");
	}


	private static void WritePersistentState()
	{
		EditorPrefs.SetString("IconSettingsJson", JsonUtility.ToJson(settings));
	}

	[MenuItem("M-Tools/HierarcyIcon/Show-Hide",false,1)]
	static void TurnOnOff()
	{
		settings.ToggleShow();
		UpdateState();
	}

	static void UpdateState()
	{
//		Debug.Log("UState");
		if (show)
		{
			EditorApplication.hierarchyWindowItemOnGUI -= DrawIconInHierarcy;
			EditorApplication.hierarchyWindowItemOnGUI += DrawIconInHierarcy;
			EditorApplication.RepaintHierarchyWindow();
		}
		else
		{
			EditorApplication.hierarchyWindowItemOnGUI -= DrawIconInHierarcy;
			EditorApplication.RepaintHierarchyWindow();
		}

		WritePersistentState();
	}

//	Man kan regga custom iconer, om listan är tom används den ej.
	private static Dictionary<GameObject, Texture2D> CustomIconDic = new Dictionary<GameObject, Texture2D>();
	public static void RegisterOverrideObject(GameObject go, Texture2D icon) // bryr sig ej om hur den registreras.
	{
		if (CustomIconDic.ContainsKey(go))
			CustomIconDic[go] = icon;
		else if (icon != null)
			CustomIconDic.Add(go, icon);

		EditorApplication.RepaintHierarchyWindow(); // NOT: osäker om detta ger preformance hit vid registrering av massa objekt vid start.
	}

	public static void RemoveOverrideObject(GameObject go)
	{
		if (CustomIconDic.ContainsKey(go))
			CustomIconDic.Remove(go);

		EditorApplication.RepaintHierarchyWindow();
	}


	private static void DrawIconInHierarcy(int instanceID, Rect selectionRect)
	{

		if (CustomIconDic != null && CustomIconDic.Count > 0)
			useOverrideIcons = true;
		else
			useOverrideIcons = false;


		GameObject go = EditorUtility.InstanceIDToObject(instanceID) as GameObject;

		if (go == null)
			return;

		Texture2D tmpHIcon = null;


		if (useOverrideIcons)
		{
			if (CustomIconDic.ContainsKey(go))
				CustomIconDic.TryGetValue(go, out tmpHIcon);
		}

		if (tmpHIcon == null)
		{
			var tmpGUIcontent = EditorGUIUtility.ObjectContent(go, typeof(object));
			// Det verkar vara helt omöjligt att utröna huvuvida Iconen är satt eller om den går till default. // Jag hittar inget vettigt sätt att ta komma åt Icon-fältet på ett object. etc.	// därför jämför jag med de två vanligaste namnen på default-texturer.
			
			//Debug.Log("NAMN: "+tmpGUIcontent.image.name);

			if (tmpGUIcontent.image.name == "GameObject Icon" || tmpGUIcontent.image.name == "Prefab Icon" || tmpGUIcontent.image.name == "d_GameObject Icon" || tmpGUIcontent.image.name =="d_Prefab Icon")
				tmpHIcon = null;
			else
				tmpHIcon = tmpGUIcontent.image as Texture2D;
		}

		if (tmpHIcon == null)
			return;


//		EditorStyles.label.normal.textColor = Color.red;


		float wh = settings.IconSize;
		var paddning = new Vector2(settings.PaddingX, settings.PaddingY);
		//		Rect iconDrawRect = new Rect(selectionRect.xMax - (wh + paddning.x), selectionRect.yMin, selectionRect.width, selectionRect.height);
		Rect iconDrawRect = new Rect(selectionRect.xMin - (wh + paddning.x), selectionRect.yMin - (paddning.y),selectionRect.width, selectionRect.height);//selectionRect.width-paddning.x, selectionRect.height-paddning.y); //  wh + paddning.x
		Color orgColor = GUI.color;
		GUIContent iconContent = new GUIContent(tmpHIcon); // man kan lägga till tooltip i GUIcontent också. Men vet inte vad det ska va bra för.
		EditorGUIUtility.SetIconSize(new Vector2(wh, wh));
		if (go.activeSelf == false) { GUI.color = disabledColor; };
		EditorGUI.LabelField(iconDrawRect, iconContent);
		GUI.color = orgColor;
		EditorGUIUtility.SetIconSize(Vector2.zero);

	}

	#region rubbish   
	// Wizard behöver settings. Nedan metod gör Denna klass beroende av att det finns en wizard.
	// Den får dessutom det aktiva settings-objektet. Vilket är både för och nackel.
	// Ändrar till att wizard hämtar en kopia av data i GetSettingsCopy propretyn ovan.

	//[MenuItem("M-Tools/HierarcyIcon/EditSettings")]
	//private static void OpenSettingsWizard()
	//{
	//	var wiz = IconHierarchyDisplayWIZ.CreateWizard();
	//	wiz.SetSettings(settings);
	//}
	#endregion
}

[System.Serializable]
public class HierarchyIconSettings
{
	public bool Show;
	[Range(1,30)]
	public float IconSize;
	[Range(-160, 50)]
	public float PaddingX;
	[Range(-10, 20)]
	public float PaddingY;

	public HierarchyIconSettings()
	{
		Show = true;
		IconSize = 15f;
		PaddingX = 15f;
		PaddingY = 0f;
	}

	public HierarchyIconSettings(bool show, float iconSize, float PaddX, float PaddY)
	{
		Show = show;
		IconSize = iconSize;
		PaddingX = PaddX;
		PaddingY = PaddY;
	}

	public void ToggleShow()
	{
		Show = !Show;
//		return Show;
	}


	public HierarchyIconSettings ShallowCopy()
	{
		return (HierarchyIconSettings) this.MemberwiseClone();
	}
}

#endif