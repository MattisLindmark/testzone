#if (UNITY_EDITOR)
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEditor;

// Detta är ej optimerat och supertestat script. 
// En Mono som gör det möjligt att samla alla refferenser till Ikoner i en lista på ett gameobjekt.
// Kan vara dålig preformance.
// Det är också mkt problematiskt om man har fler än en CustomIconList i omlopp.
// Den funkar inte heller bra ihop med CustomIcon, då de kan slå ut varandra på olika sätt. Men men.

//[ExecuteAlways]
public class CustomIconList : MonoBehaviour
{
	[SerializeField] GoIconItem[] listan;
	HashSet<GameObject> ValidList = new HashSet<GameObject>();

//	[ContextMenu("UpdateIcons")]
	void UpdateHierarcy()
	{
		if (listan == null || listan.Length < 1)
			return;

		foreach (GoIconItem itm in listan)
		{
			if (itm.go != null && itm.icon != null)
				IconHierarchyDisplay.RegisterOverrideObject(itm.go, itm.icon);
		}
	}

	private void OnValidate()
	{
		foreach (GameObject go in ValidList)
			IconHierarchyDisplay.RemoveOverrideObject(go);

		ValidList.Clear();

		foreach(GoIconItem itm in listan)
		{
			IconHierarchyDisplay.RegisterOverrideObject(itm.go, itm.icon);
			ValidList.Add(itm.go);
		}

		UpdateHierarcy();
	}

}

[System.Serializable]
class GoIconItem
{
	public GameObject go;
	public Texture2D icon;
}
#endif