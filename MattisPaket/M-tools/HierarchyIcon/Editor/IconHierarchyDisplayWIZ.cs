using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

public class IconHierarchyDisplayWIZ : ScriptableWizard
{
	static IconHierarchyDisplayWIZ instance;
	[SerializeField] HierarchyIconSettings CurrentSettings;
	private HierarchyIconSettings _CurrentSettingsRevert;
	[Space]
	[Header("Revert changes")]
	public bool RevertSettings;
	[Space]
	[Space]
	public bool ResetToDefault;

	[MenuItem("M-Tools/HierarcyIcon/EditSettings")]
	public static void CreateWizard()
	{
		if (instance != null)
			instance.Close();

		instance = ScriptableWizard.DisplayWizard<IconHierarchyDisplayWIZ>("Icon Hierarchy Display Settings", "Exit", "Apply");
		instance.CurrentSettings = IconHierarchyDisplay.GetSettingsCopy;
		instance._CurrentSettingsRevert = IconHierarchyDisplay.GetSettingsCopy;

		//		return instance;
	}

	//public void SetSettings(HierarchyIconSettings newSettings)
	//{
	//	CurrentSettings = newSettings;
	//}

	private void OnWizardUpdate()
	{
		if (RevertSettings)
		{
			// Eventuellt sätta en applay settings direkt här också, så man ej behöver trycka applay, så reseten syns direkt.
			CurrentSettings = _CurrentSettingsRevert.ShallowCopy();
			RevertSettings = false;
			OnWizardOtherButton();
		}

		if (ResetToDefault)
		{
			CurrentSettings = new HierarchyIconSettings();
			ResetToDefault = false;
			OnWizardOtherButton();
		}
	}

	private void OnWizardCreate()
	{
		
	}

	private void OnWizardOtherButton()
	{
		IconHierarchyDisplay.SetSettings = CurrentSettings;
	}

}
