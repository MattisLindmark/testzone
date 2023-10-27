#if (UNITY_EDITOR)

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[ExecuteInEditMode]
public class CustomIcon : MonoBehaviour
{
	[SerializeField] Texture2D Icon;
	[SerializeField] bool _enabled = true;
	public bool Enabled
	{
		get
		{
			return _enabled;
		}
		set
		{
			_enabled = value;
			if (value == true)
				IconHierarchyDisplay.RegisterOverrideObject(this.gameObject, Icon);
			else
				IconHierarchyDisplay.RemoveOverrideObject(this.gameObject);
		}
	}

	private void OnValidate()
	{
		Enabled = _enabled;
	}

	private void OnDestroy()
	{		
		IconHierarchyDisplay.RemoveOverrideObject(this.gameObject);
	}
}


#endif