'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, RefreshCw, Plus, Minus, Trash2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { GenerationConstraints, VocabTypeConstraint, SentenceType } from '@/lib/learning/generation/structure-constraint.service';

interface DebugMenuProps {
  sessionState: any; // Pass the entire SessionState object for inspection
  onQuestionGenerated: (data: { 
    newQuestionData: any;
    newSubmoduleId: string;
    newModalSchemaId: string;
    newSubmoduleTitle: string;
    newUiComponent: string;
    questionDebugInfo: any;
  }) => void; // Callback to update parent state
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ sessionState, onQuestionGenerated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSubmodules, setAvailableSubmodules] = useState<any[]>([]);
  const [availableModalSchemas, setAvailableModalSchemas] = useState<string[]>([]);
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState<string>('');
  const [selectedModalSchemaId, setSelectedModalSchemaId] = useState<string>('');
  
  // State for the FORCED constraints
  const [forcedConstraints, setForcedConstraints] = useState<Partial<GenerationConstraints>>({});
  const [posConstraints, setPosConstraints] = useState<VocabTypeConstraint[]>([{ vocab_type: 'NOUN', count: 1 }, { vocab_type: 'VERB', count: 1 }]);
  
  // Fetch module data when menu opens
  useEffect(() => {
    if (isOpen && sessionState.moduleId) {
      fetchModuleData(sessionState.moduleId);
    }
  }, [isOpen, sessionState.moduleId]);
  
  // Reset forced constraints when menu opens or module changes
  useEffect(() => {
      if (isOpen) {
          // Reset to some sensible defaults when opening
          setPosConstraints([{ vocab_type: 'NOUN', count: 1 }, { vocab_type: 'VERB', count: 1 }]);
          setForcedConstraints({
              numClauses: 1,
              sentenceType: SentenceType.STATEMENT,
              vocabularyTheme: null
          });
      }
  }, [isOpen]);
  
  // Fetch available submodules for the current module
  const fetchModuleData = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/learning/module?moduleId=${moduleId}`);
      if (response.ok) {
        const moduleData = await response.json();
        setAvailableSubmodules(moduleData.submodules || []);
        
        // Set initial selections
        if (moduleData.submodules?.length > 0) {
          const initialSubmodule = moduleData.submodules[0];
          setSelectedSubmoduleId(initialSubmodule.id);
          setAvailableModalSchemas(initialSubmodule.supportedModalSchemaIds || []);
          
          if (initialSubmodule.supportedModalSchemaIds?.length > 0) {
            setSelectedModalSchemaId(initialSubmodule.supportedModalSchemaIds[0]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch module data:", error);
    }
  };
  
  // Handle submodule selection change
  const handleSubmoduleChange = (submoduleId: string) => {
    setSelectedSubmoduleId(submoduleId);
    const selectedSubmodule = availableSubmodules.find(sm => sm.id === submoduleId);
    if (selectedSubmodule) {
      setAvailableModalSchemas(selectedSubmodule.supportedModalSchemaIds || []);
      
      // Reset modal schema selection if current selection is not supported
      if (selectedSubmodule.supportedModalSchemaIds?.length > 0) {
        if (!selectedSubmodule.supportedModalSchemaIds.includes(selectedModalSchemaId)) {
          setSelectedModalSchemaId(selectedSubmodule.supportedModalSchemaIds[0]);
        }
      } else {
        setSelectedModalSchemaId('');
      }
    }
  };
  
  // Handlers for updating POS constraints
  const handleVocabTypeChange = (index: number, value: string) => {
      const updated = [...posConstraints];
      updated[index].vocab_type = value;
      setPosConstraints(updated);
  };
  const handleCountChange = (index: number, value: number) => {
      const updated = [...posConstraints];
      updated[index].count = Math.max(0, value);
      setPosConstraints(updated);
  };
  const addPosConstraint = () => {
      setPosConstraints([...posConstraints, { vocab_type: '', count: 1 }]);
  };
  const removePosConstraint = (index: number) => {
      setPosConstraints(posConstraints.filter((_, i) => i !== index));
  };

  // Update generateNewQuestion to use the forced constraints state
  const generateNewQuestion = async () => {
    if (!sessionState.sessionId || !selectedSubmoduleId || !selectedModalSchemaId) return;
    
    setIsLoading(true);
    try {
        // Construct the full constraints object to send
        const constraintsToSend: GenerationConstraints = {
            targetLanguage: sessionState.targetLanguage, // Get from session state
            difficulty: sessionState.difficulty || 'intermediate', // Get from session state or default
            numClauses: forcedConstraints.numClauses ?? 1,
            sentenceType: forcedConstraints.sentenceType ?? SentenceType.STATEMENT,
            posConstraints: posConstraints.filter(pc => pc.vocab_type && pc.count > 0),
            vocabularyTheme: forcedConstraints.vocabularyTheme || null,
            numRelativeClauses: forcedConstraints.numRelativeClauses ?? 0
        };
        
      const response = await fetch(`/api/learning/session/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionState.sessionId,
          moduleId: sessionState.moduleId,
          targetLanguage: sessionState.targetLanguage,
          sourceLanguage: sessionState.sourceLanguage,
          forcedSubmoduleId: selectedSubmoduleId,
          forcedModalSchemaId: selectedModalSchemaId,
          // Send the constructed forced constraints
          forcedConstraints: constraintsToSend 
        }),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          // Call the callback WITH the debug info
          onQuestionGenerated({
            newQuestionData: responseData.newQuestionData,
            newSubmoduleId: responseData.newSubmoduleId,
            newModalSchemaId: responseData.newModalSchemaId,
            newSubmoduleTitle: responseData.newSubmoduleTitle,
            newUiComponent: responseData.newUiComponent,
            // Pass the debug info received from the API
            questionDebugInfo: responseData.questionDebugInfo 
          });
          setIsOpen(false); // Close the debug menu
        } else {
          console.error("API indicated failure:", responseData.error);
        }
      } else {
        console.error("Failed to generate new question");
      }
    } catch (error) {
      console.error("Error generating question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStateValue = (value: any): React.ReactNode => {
      if (value === null) return <span className="text-muted-foreground italic">null</span>;
      if (value === undefined) return <span className="text-muted-foreground italic">undefined</span>;
      if (typeof value === 'object') {
        try {
          const jsonString = JSON.stringify(value, null, 2);
          // If the string is very long, wrap it in a scrollable area
          if (jsonString.length > 500) { 
              return (
                  <ScrollArea className="h-[150px] w-full rounded-md border p-2 bg-background text-muted-foreground text-xs whitespace-pre-wrap break-words">
                      {jsonString}
                  </ScrollArea>
              );
          } else {
              return <span className="text-muted-foreground whitespace-pre-wrap break-words">{jsonString}</span>;
          }
        } catch {
          return <span className="text-red-500">[Circular Object]</span>;
        }
      }
      return <span className="text-muted-foreground">{String(value)}</span>;
  };

  // Helper to render the Debug Info section if available
  const renderDebugInfo = () => {
      if (!sessionState?.currentQuestionDebugInfo) {
          return null;
      }
      const { constraints, requiredVocab, enhancedPrompt } = sessionState.currentQuestionDebugInfo;
      return (
          <div className="border p-4 rounded-md mt-4">
              <h3 className="text-lg font-semibold mb-3">Generation Debug Info</h3>
              <ScrollArea className="h-[300px] w-full rounded-md">
                  <div className="space-y-3 font-mono text-xs">
                      <div>
                          <span className="font-semibold text-primary/90">Constraints Applied:</span> 
                          <div className="pl-2 mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                              {JSON.stringify(constraints, null, 2)}
                          </div>
                      </div>
                      <div>
                          <span className="font-semibold text-primary/90">Vocabulary Fetched:</span> 
                           <div className="pl-2 mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                              {JSON.stringify(requiredVocab, (key, value) => 
                                // Simplify vocab display - show POS and words, not full objects
                                Array.isArray(value) ? value.map((item: any) => item?.word || '[unknown word]') : value,
                              2)}
                          </div>
                      </div>
                      {enhancedPrompt && (
                         <div>
                            <span className="font-semibold text-primary/90">Enhanced Prompt Used (truncated):</span> 
                            <div className="pl-2 mt-1 whitespace-pre-wrap break-words text-muted-foreground">
                                {enhancedPrompt.substring(0, 400)}{enhancedPrompt.length > 400 ? '...' : ''}
                            </div>
                        </div>
                      )}    
                  </div>
              </ScrollArea>
          </div>
      );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-4 right-4 z-50 opacity-75 hover:opacity-100"
          aria-label="Open Debug Menu"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[640px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Debug Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          <div className="space-y-4 border p-4 rounded-md">
            <h3 className="text-lg font-semibold">Force Generation</h3>
            
            <div className="space-y-2">
              <Label htmlFor="submodule">Submodule</Label>
              <Select 
                value={selectedSubmoduleId} 
                onValueChange={handleSubmoduleChange}
                disabled={availableSubmodules.length === 0}
              >
                <SelectTrigger id="submodule">
                  <SelectValue placeholder="Select submodule" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubmodules.map((submodule) => (
                    <SelectItem key={submodule.id} value={submodule.id}>
                      {submodule.title_en || submodule.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="modal-schema">Modal Schema</Label>
              <Select 
                value={selectedModalSchemaId} 
                onValueChange={setSelectedModalSchemaId}
                disabled={availableModalSchemas.length === 0}
              >
                <SelectTrigger id="modal-schema">
                  <SelectValue placeholder="Select modal schema" />
                </SelectTrigger>
                <SelectContent>
                  {availableModalSchemas.map((schemaId) => (
                    <SelectItem key={schemaId} value={schemaId}>
                      {schemaId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* --- NEW: Constraint Controls --- */}
            <div className="space-y-3 pt-3 border-t">
                 <h4 className="font-medium text-md">Sentence Constraints</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="num-clauses">Num Clauses</Label>
                        <Input id="num-clauses" type="number" min={1} value={forcedConstraints.numClauses ?? 1} onChange={(e) => setForcedConstraints(prev => ({...prev, numClauses: parseInt(e.target.value, 10) || 1}))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sentence-type">Sentence Type</Label>
                        <Select value={forcedConstraints.sentenceType ?? SentenceType.STATEMENT} onValueChange={(v) => setForcedConstraints(prev => ({...prev, sentenceType: v as SentenceType}))}>
                            <SelectTrigger id="sentence-type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.values(SentenceType).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="num-rel-clauses">Num Relative Clauses</Label>
                        <Input id="num-rel-clauses" type="number" min={0} value={forcedConstraints.numRelativeClauses ?? 0} onChange={(e) => setForcedConstraints(prev => ({...prev, numRelativeClauses: parseInt(e.target.value, 10) || 0}))} />
                    </div>
                 </div>
                 <div className="space-y-2">
                     <Label htmlFor="vocab-theme">Vocabulary Theme (Optional)</Label>
                     <Input id="vocab-theme" type="text" placeholder="e.g., travel, food" value={forcedConstraints.vocabularyTheme ?? ''} onChange={(e) => setForcedConstraints(prev => ({...prev, vocabularyTheme: e.target.value || null}))} />
                 </div>
                 
                 <div className="space-y-2">
                     <Label>Vocabulary Type Counts</Label>
                     {posConstraints.map((pc, index) => (
                         <div key={index} className="flex items-center gap-2">
                             <Input 
                                placeholder="Type (e.g. NOUN)"
                                value={pc.vocab_type}
                                onChange={(e) => handleVocabTypeChange(index, e.target.value)}
                                className="flex-1"
                             />
                             <Input 
                                type="number" 
                                min={0} 
                                value={pc.count} 
                                onChange={(e) => handleCountChange(index, parseInt(e.target.value, 10) || 0)}
                                className="w-16"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removePosConstraint(index)} aria-label="Remove POS constraint">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
              </div>
            ))}
                     <Button variant="outline" size="sm" onClick={addPosConstraint} className="mt-1">
                         <Plus className="mr-1 h-4 w-4" /> Add Type
                     </Button>
                 </div>
            </div>
            {/* --- END: Constraint Controls --- */}
            
            <Button 
              onClick={generateNewQuestion}
              disabled={isLoading || !selectedSubmoduleId || !selectedModalSchemaId}
              className="w-full mt-4"
            >
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Generating...' : 'Generate New Question'}
            </Button>
          </div>
          
          {/* --- Generation Debug Info Section --- */}
          {renderDebugInfo()} 
          
          {/* --- Current Session State Section --- */}
          <div className="border p-4 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Full Current Session State</h3>
              <ScrollArea className="h-[400px] w-full rounded-md"> 
                  <div className="space-y-2 font-mono text-sm">
                    {/* Filter out the debug info from the main state display to avoid duplication */}
                    {Object.entries(sessionState)
                        .filter(([key]) => key !== 'currentQuestionDebugInfo') 
                        .map(([key, value]) => (
                      <div key={key}>
                        <span className="font-semibold text-primary/90">{key}:</span> 
                        <div className="pl-2 mt-1">
                            {renderStateValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
              </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 